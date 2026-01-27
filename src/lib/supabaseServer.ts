// src/lib/supabaseServer.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceBusinessProfile,
  WorkspaceAiDocument,
  WorkspaceAiKnowledge,
  WorkspaceMemberInvite,
  WorkspaceAiLibraryEvent,
  WorkspaceCanvasModel,
  BusinessPlan,
  BusinessPlanChapter,
  BusinessPlanSection,
  BusinessPlanAiConversation,
  BusinessPlanAiMessage,
  BusinessPlanPendingChange,
  BusinessPlanSectionContent,
  PitchDeckTemplate,
  PitchDeck,
  PitchDeckSlide,
  PitchDeckSettings,
  PitchDeckSlideContent,
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
          created_by?: string | null;
          name: string;
          file_type?: string | null;
          storage_bucket: string;
          storage_path: string;
          uploaded_at?: string;
          status?: WorkspaceAiDocument["status"];
          ai_metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          created_by?: string | null;
          name?: string;
          file_type?: string | null;
          storage_bucket?: string;
          storage_path?: string;
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
      workspace_ai_library_events: {
        Row: WorkspaceAiLibraryEvent;
        Insert: {
          id?: string;
          workspace_id: string;
          user_id?: string | null;
          event_type: WorkspaceAiLibraryEvent["event_type"];
          document_id?: string | null;
          knowledge_id?: string | null;
          payload?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string | null;
          event_type?: WorkspaceAiLibraryEvent["event_type"];
          document_id?: string | null;
          knowledge_id?: string | null;
          payload?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_ai_library_events_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_ai_library_events_document_id_fkey";
            columns: ["document_id"];
            referencedRelation: "workspace_ai_documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_ai_library_events_knowledge_id_fkey";
            columns: ["knowledge_id"];
            referencedRelation: "workspace_ai_knowledge";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_canvas_models: {
        Row: WorkspaceCanvasModel;
        Insert: {
          id?: string;
          workspace_id: string;
          created_by: string;
          title: string;
          template_type: WorkspaceCanvasModel["template_type"];
          sections_data?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          created_by?: string;
          title?: string;
          template_type?: WorkspaceCanvasModel["template_type"];
          sections_data?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_canvas_models_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_business_plans: {
        Row: BusinessPlan;
        Insert: {
          id?: string;
          workspace_id: string;
          title: string;
          status?: BusinessPlan["status"];
          export_settings?: BusinessPlan["export_settings"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          title?: string;
          status?: BusinessPlan["status"];
          export_settings?: BusinessPlan["export_settings"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_business_plans_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      business_plan_chapters: {
        Row: BusinessPlanChapter;
        Insert: {
          id?: string;
          business_plan_id: string;
          parent_id?: string | null;
          title: string;
          order_index?: number;
          is_collapsed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_plan_id?: string;
          parent_id?: string | null;
          title?: string;
          order_index?: number;
          is_collapsed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_plan_chapters_business_plan_id_fkey";
            columns: ["business_plan_id"];
            referencedRelation: "workspace_business_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_plan_chapters_parent_id_fkey";
            columns: ["parent_id"];
            referencedRelation: "business_plan_chapters";
            referencedColumns: ["id"];
          },
        ];
      };
      business_plan_sections: {
        Row: BusinessPlanSection;
        Insert: {
          id?: string;
          chapter_id: string;
          section_type: BusinessPlanSection["section_type"];
          content: BusinessPlanSectionContent;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          chapter_id?: string;
          section_type?: BusinessPlanSection["section_type"];
          content?: BusinessPlanSectionContent;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_plan_sections_chapter_id_fkey";
            columns: ["chapter_id"];
            referencedRelation: "business_plan_chapters";
            referencedColumns: ["id"];
          },
        ];
      };
      business_plan_ai_conversations: {
        Row: BusinessPlanAiConversation;
        Insert: {
          id?: string;
          business_plan_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_plan_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_plan_ai_conversations_business_plan_id_fkey";
            columns: ["business_plan_id"];
            referencedRelation: "workspace_business_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      business_plan_ai_messages: {
        Row: BusinessPlanAiMessage;
        Insert: {
          id?: string;
          conversation_id: string;
          role: BusinessPlanAiMessage["role"];
          content: string;
          metadata?: BusinessPlanAiMessage["metadata"];
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: BusinessPlanAiMessage["role"];
          content?: string;
          metadata?: BusinessPlanAiMessage["metadata"];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_plan_ai_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "business_plan_ai_conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      business_plan_pending_changes: {
        Row: BusinessPlanPendingChange;
        Insert: {
          id?: string;
          conversation_id: string;
          message_id: string;
          change_type: BusinessPlanPendingChange["change_type"];
          target_id?: string | null;
          proposed_data: Record<string, unknown>;
          status?: BusinessPlanPendingChange["status"];
          created_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          message_id?: string;
          change_type?: BusinessPlanPendingChange["change_type"];
          target_id?: string | null;
          proposed_data?: Record<string, unknown>;
          status?: BusinessPlanPendingChange["status"];
          created_at?: string;
          reviewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "business_plan_pending_changes_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "business_plan_ai_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_plan_pending_changes_message_id_fkey";
            columns: ["message_id"];
            referencedRelation: "business_plan_ai_messages";
            referencedColumns: ["id"];
          },
        ];
      };
      pitch_deck_templates: {
        Row: PitchDeckTemplate;
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          thumbnail_url?: string | null;
          cover_design: PitchDeckTemplate["cover_design"];
          slide_design: PitchDeckTemplate["slide_design"];
          color_scheme: PitchDeckTemplate["color_scheme"];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          cover_design?: PitchDeckTemplate["cover_design"];
          slide_design?: PitchDeckTemplate["slide_design"];
          color_scheme?: PitchDeckTemplate["color_scheme"];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pitch_decks: {
        Row: PitchDeck;
        Insert: {
          id?: string;
          workspace_id: string;
          template_id?: string | null;
          title: string;
          settings: PitchDeckSettings;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          template_id?: string | null;
          title?: string;
          settings?: PitchDeckSettings;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pitch_decks_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pitch_decks_template_id_fkey";
            columns: ["template_id"];
            referencedRelation: "pitch_deck_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      pitch_deck_slides: {
        Row: PitchDeckSlide;
        Insert: {
          id?: string;
          pitch_deck_id: string;
          title: string;
          slide_type: PitchDeckSlide["slide_type"];
          order_index?: number;
          content: PitchDeckSlideContent;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pitch_deck_id?: string;
          title?: string;
          slide_type?: PitchDeckSlide["slide_type"];
          order_index?: number;
          content?: PitchDeckSlideContent;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pitch_deck_slides_pitch_deck_id_fkey";
            columns: ["pitch_deck_id"];
            referencedRelation: "pitch_decks";
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

type SupabaseClientOptions = {
  fresh?: boolean;
};

export function getSupabaseClient(
  options?: SupabaseClientOptions
): SupabaseClient<SupabaseDb> {
  if (!options?.fresh && supabaseClient) return supabaseClient;

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

  const client = createClient<SupabaseDb>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  if (!options?.fresh) {
    supabaseClient = client;
  }

  return client;
}
