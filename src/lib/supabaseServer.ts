// src/lib/supabaseServer.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceBusinessProfile,
  WorkspaceAiDocument,
  WorkspaceAiKnowledge,
  WorkspaceMemberInvite,
} from "@/types/workspaces";

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: Workspace;
        Insert: {
          id?: string;
          owner_user_id: string;
          name: string;
          image_url?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          name?: string;
          image_url?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: WorkspaceMember;
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role: WorkspaceMember["role"];
          status?: WorkspaceMember["status"];
          invited_email?: string | null;
          added_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: WorkspaceMember["role"];
          status?: WorkspaceMember["status"];
          invited_email?: string | null;
          added_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_business_profile: {
        Row: WorkspaceBusinessProfile;
        Insert: {
          id?: string;
          workspace_id: string;
          tagline?: string | null;
          is_operating?: boolean | null;
          industry?: string | null;
          company_stage?: string | null;
          problem_short?: string | null;
          problem_long?: string | null;
          solution_and_uniqueness?: string | null;
          team_and_roles?: string | null;
          financial_projections?: string | null;
          risks_and_mitigation?: string | null;
          success_metrics?: string | null;
          growth_partnerships?: string | null;
          raw_form_data?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          tagline?: string | null;
          is_operating?: boolean | null;
          industry?: string | null;
          company_stage?: string | null;
          problem_short?: string | null;
          problem_long?: string | null;
          solution_and_uniqueness?: string | null;
          team_and_roles?: string | null;
          financial_projections?: string | null;
          risks_and_mitigation?: string | null;
          success_metrics?: string | null;
          growth_partnerships?: string | null;
          raw_form_data?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_business_profile_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_ai_documents: {
        Row: WorkspaceAiDocument;
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          file_type?: string | null;
          storage_url: string;
          uploaded_at?: string;
          status?: WorkspaceAiDocument["status"];
          ai_metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          file_type?: string | null;
          storage_url?: string;
          uploaded_at?: string;
          status?: WorkspaceAiDocument["status"];
          ai_metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_ai_documents_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_ai_knowledge: {
        Row: WorkspaceAiKnowledge;
        Insert: {
          id?: string;
          workspace_id: string;
          key_name: string;
          label: string;
          value: string;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          key_name?: string;
          label?: string;
          value?: string;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_ai_knowledge_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_member_invites: {
        Row: WorkspaceMemberInvite;
        Insert: {
          id?: string;
          workspace_id: string;
          email: string;
          role: WorkspaceMemberInvite["role"];
          token: string;
          invited_by_user_id: string;
          expires_at?: string | null;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          email?: string;
          role?: WorkspaceMemberInvite["role"];
          token?: string;
          invited_by_user_id?: string;
          expires_at?: string | null;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_member_invites_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type SupabaseDb = Database;

let supabaseClient: SupabaseClient<SupabaseDb> | null = null;

export function getSupabaseClient(): SupabaseClient<SupabaseDb> {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("SUPABASE_URL is not set in environment variables.");
  }

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.",
    );
  }

  supabaseClient = createClient<SupabaseDb>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  return supabaseClient;
}
