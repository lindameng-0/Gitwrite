export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chapter_reviews: {
        Row: {
          chapter_id: string
          created_at: string
          feedback: string | null
          id: string
          reviewer_name: string
          status: string
          updated_at: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          reviewer_name: string
          status: string
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          reviewer_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_reviews_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_versions: {
        Row: {
          author_name: string
          chapter_id: string
          content: string
          created_at: string
          id: string
          is_current: boolean
          merge_note: string | null
          merged_from_branch_id: string | null
          version_number: number
        }
        Insert: {
          author_name?: string
          chapter_id: string
          content?: string
          created_at?: string
          id?: string
          is_current?: boolean
          merge_note?: string | null
          merged_from_branch_id?: string | null
          version_number?: number
        }
        Update: {
          author_name?: string
          chapter_id?: string
          content?: string
          created_at?: string
          id?: string
          is_current?: boolean
          merge_note?: string | null
          merged_from_branch_id?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "chapter_versions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_versions_merged_from_branch_id_fkey"
            columns: ["merged_from_branch_id"]
            isOneToOne: false
            referencedRelation: "story_branches"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          author_name: string
          branch_count: number
          branch_id: string
          chapter_order: number
          content: string
          created_at: string
          id: string
          status: string
          story_id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          branch_count?: number
          branch_id: string
          chapter_order: number
          content?: string
          created_at?: string
          id?: string
          status?: string
          story_id: string
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          branch_count?: number
          branch_id?: string
          chapter_order?: number
          content?: string
          created_at?: string
          id?: string
          status?: string
          story_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "story_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapters_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      draft_collaborators: {
        Row: {
          approved_at: string | null
          branch_id: string
          id: string
          invited_by: string | null
          requested_at: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          branch_id: string
          id?: string
          invited_by?: string | null
          requested_at?: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          branch_id?: string
          id?: string
          invited_by?: string | null
          requested_at?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      draft_suggestions: {
        Row: {
          author_name: string
          branch_id: string
          chapter_id: string
          created_at: string
          id: string
          original_text: string | null
          resolved_at: string | null
          resolved_by: string | null
          selection_end: number | null
          selection_start: number | null
          status: string
          suggestion_text: string
          user_id: string
        }
        Insert: {
          author_name: string
          branch_id: string
          chapter_id: string
          created_at?: string
          id?: string
          original_text?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          selection_end?: number | null
          selection_start?: number | null
          status?: string
          suggestion_text: string
          user_id: string
        }
        Update: {
          author_name?: string
          branch_id?: string
          chapter_id?: string
          created_at?: string
          id?: string
          original_text?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          selection_end?: number | null
          selection_start?: number | null
          status?: string
          suggestion_text?: string
          user_id?: string
        }
        Relationships: []
      }
      merge_requests: {
        Row: {
          author_name: string
          chapter_title: string | null
          conflicting_requests: string[] | null
          created_at: string | null
          has_conflicts: boolean | null
          id: string
          priority: number | null
          requested_at: string | null
          requested_by: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_branch_id: string
          source_chapter_id: string | null
          status: string | null
          story_id: string
          target_branch_id: string
          updated_at: string | null
        }
        Insert: {
          author_name: string
          chapter_title?: string | null
          conflicting_requests?: string[] | null
          created_at?: string | null
          has_conflicts?: boolean | null
          id?: string
          priority?: number | null
          requested_at?: string | null
          requested_by: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_branch_id: string
          source_chapter_id?: string | null
          status?: string | null
          story_id: string
          target_branch_id: string
          updated_at?: string | null
        }
        Update: {
          author_name?: string
          chapter_title?: string | null
          conflicting_requests?: string[] | null
          created_at?: string | null
          has_conflicts?: boolean | null
          id?: string
          priority?: number | null
          requested_at?: string | null
          requested_by?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_branch_id?: string
          source_chapter_id?: string | null
          status?: string | null
          story_id?: string
          target_branch_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      save_points: {
        Row: {
          author_name: string
          branch_id: string
          created_at: string
          description: string | null
          id: string
          snapshot_data: Json
          story_id: string
          title: string
        }
        Insert: {
          author_name?: string
          branch_id: string
          created_at?: string
          description?: string | null
          id?: string
          snapshot_data: Json
          story_id: string
          title: string
        }
        Update: {
          author_name?: string
          branch_id?: string
          created_at?: string
          description?: string | null
          id?: string
          snapshot_data?: Json
          story_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "save_points_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "story_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "save_points_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          studio_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          studio_id?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          studio_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      story_branches: {
        Row: {
          author_name: string
          content: string
          created_at: string
          deleted_at: string | null
          fork_point_chapter_id: string | null
          fork_point_order: number | null
          id: string
          is_active: boolean
          is_main: boolean
          is_protected: boolean
          name: string
          parent_branch_id: string | null
          position_x: number | null
          position_y: number | null
          status: string
          story_id: string
          studio_id: string | null
          updated_at: string
        }
        Insert: {
          author_name?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          fork_point_chapter_id?: string | null
          fork_point_order?: number | null
          id?: string
          is_active?: boolean
          is_main?: boolean
          is_protected?: boolean
          name: string
          parent_branch_id?: string | null
          position_x?: number | null
          position_y?: number | null
          status?: string
          story_id: string
          studio_id?: string | null
          updated_at?: string
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          fork_point_chapter_id?: string | null
          fork_point_order?: number | null
          id?: string
          is_active?: boolean
          is_main?: boolean
          is_protected?: boolean
          name?: string
          parent_branch_id?: string | null
          position_x?: number | null
          position_y?: number | null
          status?: string
          story_id?: string
          studio_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_branches_fork_point_chapter_id_fkey"
            columns: ["fork_point_chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_branches_parent_branch_id_fkey"
            columns: ["parent_branch_id"]
            isOneToOne: false
            referencedRelation: "story_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_branches_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_branches_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_invites: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          invite_code: string
          max_uses: number | null
          role: string
          studio_id: string
          uses_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          invite_code: string
          max_uses?: number | null
          role?: string
          studio_id: string
          uses_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          invite_code?: string
          max_uses?: number | null
          role?: string
          studio_id?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "studio_invites_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_members: {
        Row: {
          id: string
          invited_at: string | null
          joined_at: string | null
          role: string
          studio_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          role?: string
          studio_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          role?: string
          studio_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_members_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studios: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      detect_merge_conflicts: {
        Args: { p_merge_request_id: string }
        Returns: {
          author_name: string
          branch_name: string
          chapter_title: string
          conflicting_branch_id: string
          conflicting_request_id: string
          fork_point_chapter_id: string
        }[]
      }
      is_draft_collaborator: { Args: { branch_uuid: string }; Returns: boolean }
      is_draft_owner: { Args: { branch_uuid: string }; Returns: boolean }
      is_studio_member: { Args: { studio_uuid: string }; Returns: boolean }
      is_studio_owner: { Args: { studio_uuid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
