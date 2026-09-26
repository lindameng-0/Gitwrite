import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { createProject } from "../src/workspace/model";

test("PostgreSQL enforces membership, atomic saves, stale-write rejection, and immutable recovery", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key, email text);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;`);
    await db.exec(
      readFileSync(
        new URL(
          "../supabase/migrations/20260926000000_gitwrite_v2.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const owner = crypto.randomUUID(),
      editor = crypto.randomUUID(),
      viewer = crypto.randomUUID(),
      outsider = crypto.randomUUID();
    await db.query(
      "insert into auth.users values($1,$2),($3,$4),($5,$6),($7,$8)",
      [
        owner,
        "owner@test.invalid",
        editor,
        "editor@test.invalid",
        viewer,
        "viewer@test.invalid",
        outsider,
        "outsider@test.invalid",
      ],
    );
    const as = async (id: string) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id,
      ]);
      await db.exec("set role authenticated");
    };
    const project = createProject("Team manuscript");
    await as(owner);
    await db.query("select gw_create_project($1::jsonb)", [
      JSON.stringify(project),
    ]);
    await db.query("select gw_add_member($1,'editor@test.invalid','editor')", [
      project.id,
    ]);
    await db.query("select gw_add_member($1,'viewer@test.invalid','viewer')", [
      project.id,
    ]);
    assert.equal(
      (await db.query("select * from gw_list_projects()")).rows.length,
      1,
    );
    await assert.rejects(
      db.query("update gw_projects set version=99"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("delete from gw_revisions"),
      /permission denied/,
    );
    await as(outsider);
    assert.equal(
      (await db.query("select * from gw_list_projects()")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from gw_recovery_versions($1)", [project.id]))
        .rows.length,
      0,
    );
    await assert.rejects(
      db.query("select gw_save_project($1,1,$2::jsonb)", [
        project.id,
        JSON.stringify(project),
      ]),
      /editing access/,
    );
    await as(viewer);
    assert.equal(
      (await db.query("select * from gw_list_projects()")).rows.length,
      1,
    );
    await assert.rejects(
      db.query("select gw_save_project($1,1,$2::jsonb)", [
        project.id,
        JSON.stringify(project),
      ]),
      /editing access/,
    );
    await as(editor);
    await assert.rejects(
      db.query("select gw_add_member($1,'outsider@test.invalid','editor')", [
        project.id,
      ]),
      /Only the owner/,
    );
    project.title = "Edited manuscript";
    await db.query("select gw_save_project($1,1,$2::jsonb)", [
      project.id,
      JSON.stringify(project),
    ]);
    project.title = "This stale write must fail";
    await assert.rejects(
      db.query("select gw_save_project($1,1,$2::jsonb)", [
        project.id,
        JSON.stringify(project),
      ]),
      /stale_revision/,
    );
    const rows = (
      await db.query<{ state: { title: string }; version: number }>(
        "select * from gw_list_projects()",
      )
    ).rows;
    assert.equal(rows[0].state.title, "Edited manuscript");
    assert.equal(Number(rows[0].version), 2);
    const ledger = (
      await db.query<{ state: { title: string } }>(
        "select * from gw_recovery_versions($1)",
        [project.id],
      )
    ).rows;
    assert.equal(ledger.length, 2);
    assert.equal(ledger[1].state.title, "Team manuscript");
    await as(owner);
    await db.query("select gw_remove_member($1,$2)", [project.id, editor]);
    await as(editor);
    await assert.rejects(
      db.query("select gw_save_project($1,2,$2::jsonb)", [
        project.id,
        JSON.stringify(project),
      ]),
      /editing access/,
    );
    await db.exec("reset role; set role anon");
    await assert.rejects(
      db.query("select * from gw_list_projects()"),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
