-- Separate v2 tables preserve all legacy manuscripts during rollout.
create table public.gw_projects (
  id uuid primary key,
  owner_id uuid not null references auth.users(id),
  state jsonb not null check ((state->>'schema' = '2'
    and state->>'id' = id::text and length(trim(state->>'title')) > 0
    and jsonb_typeof(state->'chapters') = 'array'
    and jsonb_typeof(state->'drafts') = 'array'
    and jsonb_typeof(state->'proposals') = 'array'
    and jsonb_typeof(state->'comments') = 'array'
    and jsonb_typeof(state->'history') = 'array') is true),
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);
create table public.gw_members (
  project_id uuid not null references public.gw_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  primary key(project_id, user_id)
);
alter table public.gw_projects enable row level security;
alter table public.gw_members enable row level security;
-- All mutations use checked RPCs. No direct table write privileges.
revoke all on public.gw_projects, public.gw_members from anon, authenticated;

create function public.gw_list_projects() returns table(state jsonb, version bigint, role text)
language sql stable security definer set search_path = public as $$
  select p.state, p.version, m.role from gw_projects p join gw_members m on m.project_id = p.id
  where m.user_id = auth.uid() order by p.updated_at desc;
$$;
create function public.gw_create_project(p_state jsonb) returns bigint
language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if p_state->>'schema' is distinct from '2' or jsonb_typeof(p_state->'chapters') is distinct from 'array' or length(p_state->>'title') < 1 then raise exception 'Invalid project'; end if;
  new_id := (p_state->>'id')::uuid;
  insert into gw_projects(id, owner_id, state) values(new_id, auth.uid(), p_state);
  insert into gw_members values(new_id, auth.uid(), 'owner');
  return 1;
end;
$$;
create function public.gw_save_project(p_id uuid, p_expected bigint, p_state jsonb) returns bigint
language plpgsql security definer set search_path = public as $$
declare next_version bigint;
begin
  if not exists(select 1 from gw_members where project_id = p_id and user_id = auth.uid() and role in ('owner', 'editor')) then raise exception 'You do not have editing access'; end if;
  if p_state->>'id' is distinct from p_id::text or p_state->>'schema' is distinct from '2' or jsonb_typeof(p_state->'chapters') is distinct from 'array' then raise exception 'Invalid project'; end if;
  update gw_projects set state = p_state, version = version + 1, updated_at = now() where id = p_id and version = p_expected returning version into next_version;
  if next_version is null then raise exception 'stale_revision'; end if;
  return next_version;
end;
$$;
create function public.gw_add_member(p_id uuid, p_email text, p_role text) returns void
language plpgsql security definer set search_path = public as $$
declare member_id uuid;
begin
  if not exists(select 1 from gw_members where project_id = p_id and user_id = auth.uid() and role = 'owner') then raise exception 'Only the owner can manage access'; end if;
  if p_role not in ('editor', 'viewer') then raise exception 'Invalid role'; end if;
  select id into member_id from auth.users where lower(email) = lower(trim(p_email));
  if member_id is null then raise exception 'Ask this person to sign in to Gitwrite first, then add them again'; end if;
  if member_id = auth.uid() then raise exception 'You already own this project'; end if;
  insert into gw_members values(p_id, member_id, p_role) on conflict (project_id, user_id) do update set role = excluded.role;
end;
$$;
create function public.gw_list_members(p_id uuid) returns table(user_id uuid, email text, role text)
language sql stable security definer set search_path = public as $$
  select m.user_id, u.email::text, m.role from gw_members m join auth.users u on u.id = m.user_id
  where m.project_id = p_id and exists(select 1 from gw_members me where me.project_id = p_id and me.user_id = auth.uid());
$$;
create function public.gw_remove_member(p_id uuid, p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists(select 1 from gw_members where project_id = p_id and user_id = auth.uid() and role = 'owner') then raise exception 'Only the owner can manage access'; end if;
  delete from gw_members where project_id = p_id and user_id = p_user and role <> 'owner';
end;
$$;
revoke execute on function public.gw_list_projects(), public.gw_create_project(jsonb), public.gw_save_project(uuid,bigint,jsonb), public.gw_add_member(uuid,text,text), public.gw_list_members(uuid), public.gw_remove_member(uuid,uuid) from public, anon;
grant execute on function public.gw_list_projects(), public.gw_create_project(jsonb), public.gw_save_project(uuid,bigint,jsonb), public.gw_add_member(uuid,text,text), public.gw_list_members(uuid), public.gw_remove_member(uuid,uuid) to authenticated;

-- An append-only server ledger also preserves versions independently of client
-- history metadata. Clients cannot update or delete these recovery snapshots.
create table public.gw_revisions (
  project_id uuid not null references public.gw_projects(id) on delete cascade,
  version bigint not null,
  state jsonb not null,
  actor_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  primary key(project_id, version)
);
alter table public.gw_revisions enable row level security;
revoke all on public.gw_revisions from anon, authenticated;
create function public.gw_capture_revision() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into gw_revisions(project_id, version, state, actor_id) values(new.id, new.version, new.state, auth.uid());
  return new;
end;
$$;
revoke execute on function public.gw_capture_revision() from public, anon, authenticated;
create trigger gw_project_revision after insert or update on public.gw_projects for each row execute function public.gw_capture_revision();
create function public.gw_recovery_versions(p_id uuid) returns table(version bigint, state jsonb, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.version, r.state, r.created_at from gw_revisions r
  where r.project_id = p_id and exists(select 1 from gw_members where project_id = p_id and user_id = auth.uid())
  order by r.version desc;
$$;
revoke execute on function public.gw_recovery_versions(uuid) from public, anon;
grant execute on function public.gw_recovery_versions(uuid) to authenticated;
