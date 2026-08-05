/**
 * Generated from the live schema — do not edit by hand.
 *
 * Regenerate after any migration:
 *   npx supabase gen types typescript --project-id wiajwelffyzfeznlftcy > lib/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          is_active: boolean;
          job_title: string | null;
          last_seen_at: string | null;
          locale: string;
          organization_id: string | null;
          phone: string | null;
          portal: Database["public"]["Enums"]["portal"];
          role_id: string | null;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          email: string;
          full_name?: string;
          id: string;
          is_active?: boolean;
          job_title?: string | null;
          last_seen_at?: string | null;
          locale?: string;
          organization_id?: string | null;
          phone?: string | null;
          portal?: Database["public"]["Enums"]["portal"];
          role_id?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          job_title?: string | null;
          last_seen_at?: string | null;
          locale?: string;
          organization_id?: string | null;
          phone?: string | null;
          portal?: Database["public"]["Enums"]["portal"];
          role_id?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      media_assets: {
        Row: {
          alt_text: string | null; caption: string | null; created_at: string;
          filename: string; folder: string; height: number | null; id: string;
          kind: Database["public"]["Enums"]["media_kind"]; mime_type: string;
          public_url: string; size_bytes: number; storage_path: string;
          title: string | null; updated_at: string; uploaded_by: string | null;
          width: number | null;
        };
        Insert: {
          alt_text?: string | null; caption?: string | null; created_at?: string;
          filename: string; folder?: string; height?: number | null; id?: string;
          kind?: Database["public"]["Enums"]["media_kind"]; mime_type: string;
          public_url: string; size_bytes?: number; storage_path: string;
          title?: string | null; updated_at?: string; uploaded_by?: string | null;
          width?: number | null;
        };
        Update: {
          alt_text?: string | null; caption?: string | null; created_at?: string;
          filename?: string; folder?: string; height?: number | null; id?: string;
          kind?: Database["public"]["Enums"]["media_kind"]; mime_type?: string;
          public_url?: string; size_bytes?: number; storage_path?: string;
          title?: string | null; updated_at?: string; uploaded_by?: string | null;
          width?: number | null;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          created_at: string;
          id: string;
          industry: string | null;
          name: string;
          slug: string;
          tier: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          industry?: string | null;
          name: string;
          slug: string;
          tier?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          industry?: string | null;
          name?: string;
          slug?: string;
          tier?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: { created_at: string; created_by: string | null; currency: string; discount_pct: number; due_date: string | null; id: string; issue_date: string; notes: string | null; number: string; organization_id: string; status: Database["public"]["Enums"]["invoice_status"]; tax_pct: number; updated_at: string };
        Insert: { created_at?: string; created_by?: string | null; currency?: string; discount_pct?: number; due_date?: string | null; id?: string; issue_date?: string; notes?: string | null; number: string; organization_id: string; status?: Database["public"]["Enums"]["invoice_status"]; tax_pct?: number; updated_at?: string };
        Update: { created_at?: string; created_by?: string | null; currency?: string; discount_pct?: number; due_date?: string | null; id?: string; issue_date?: string; notes?: string | null; number?: string; organization_id?: string; status?: Database["public"]["Enums"]["invoice_status"]; tax_pct?: number; updated_at?: string };
        Relationships: [];
      };
      invoice_line_items: {
        Row: { created_at: string; description: string; id: string; invoice_id: string; position: number; quantity: number; unit_price: number };
        Insert: { created_at?: string; description: string; id?: string; invoice_id: string; position?: number; quantity?: number; unit_price?: number };
        Update: { created_at?: string; description?: string; id?: string; invoice_id?: string; position?: number; quantity?: number; unit_price?: number };
        Relationships: [];
      };
      invoice_payments: {
        Row: { amount: number; created_at: string; id: string; invoice_id: string; method: string; paid_at: string; recorded_by: string | null; reference: string | null };
        Insert: { amount: number; created_at?: string; id?: string; invoice_id: string; method?: string; paid_at?: string; recorded_by?: string | null; reference?: string | null };
        Update: { amount?: number; created_at?: string; id?: string; invoice_id?: string; method?: string; paid_at?: string; recorded_by?: string | null; reference?: string | null };
        Relationships: [];
      };
      isolation_policies: {
        Row: {
          description: string;
          enabled: boolean;
          id: string;
          label: string;
          module_id: string | null;
          tone: string;
          updated_at: string;
        };
        Insert: {
          description?: string;
          enabled?: boolean;
          id: string;
          label: string;
          module_id?: string | null;
          tone?: string;
          updated_at?: string;
        };
        Update: {
          description?: string;
          enabled?: boolean;
          id?: string;
          label?: string;
          module_id?: string | null;
          tone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      menus: {
        Row: { created_at: string; id: string; location: Database["public"]["Enums"]["menu_location"] | null; name: string; updated_at: string };
        Insert: { created_at?: string; id?: string; location?: Database["public"]["Enums"]["menu_location"] | null; name: string; updated_at?: string };
        Update: { created_at?: string; id?: string; location?: Database["public"]["Enums"]["menu_location"] | null; name?: string; updated_at?: string };
        Relationships: [];
      };
      menu_items: {
        Row: { badge: string | null; created_at: string; external_url: string | null; id: string; is_visible: boolean; item_type: Database["public"]["Enums"]["menu_item_type"]; label: string; menu_id: string; open_in_new_tab: boolean; page_id: string | null; parent_id: string | null; position: number; updated_at: string };
        Insert: { badge?: string | null; created_at?: string; external_url?: string | null; id?: string; is_visible?: boolean; item_type?: Database["public"]["Enums"]["menu_item_type"]; label: string; menu_id: string; open_in_new_tab?: boolean; page_id?: string | null; parent_id?: string | null; position?: number; updated_at?: string };
        Update: { badge?: string | null; created_at?: string; external_url?: string | null; id?: string; is_visible?: boolean; item_type?: Database["public"]["Enums"]["menu_item_type"]; label?: string; menu_id?: string; open_in_new_tab?: boolean; page_id?: string | null; parent_id?: string | null; position?: number; updated_at?: string };
        Relationships: [];
      };
      staff_profiles: {
        Row: { created_at: string; department: Database["public"]["Enums"]["department"] | null; display_order: number; display_role: string; id: string; is_public: boolean; skills: string[]; slug: string; updated_at: string };
        Insert: { created_at?: string; department?: Database["public"]["Enums"]["department"] | null; display_order?: number; display_role?: string; id: string; is_public?: boolean; skills?: string[]; slug: string; updated_at?: string };
        Update: { created_at?: string; department?: Database["public"]["Enums"]["department"] | null; display_order?: number; display_role?: string; id?: string; is_public?: boolean; skills?: string[]; slug?: string; updated_at?: string };
        Relationships: [];
      };
      site_settings: {
        Row: { homepage_page_id: string | null; id: boolean; site_name: string; updated_at: string; updated_by: string | null };
        Insert: { homepage_page_id?: string | null; id?: boolean; site_name?: string; updated_at?: string; updated_by?: string | null };
        Update: { homepage_page_id?: string | null; id?: boolean; site_name?: string; updated_at?: string; updated_by?: string | null };
        Relationships: [];
      };
      page_templates: {
        Row: {
          blocks: Json; category: string; created_at: string; description: string;
          display_order: number; id: string; is_system: boolean; name: string;
          preview_url: string | null; updated_at: string;
        };
        Insert: {
          blocks?: Json; category?: string; created_at?: string; description?: string;
          display_order?: number; id: string; is_system?: boolean; name: string;
          preview_url?: string | null; updated_at?: string;
        };
        Update: {
          blocks?: Json; category?: string; created_at?: string; description?: string;
          display_order?: number; id?: string; is_system?: boolean; name?: string;
          preview_url?: string | null; updated_at?: string;
        };
        Relationships: [];
      };
      pages: {
        Row: {
          created_at: string; created_by: string | null; id: string;
          internal_name: string; nav_in_main: boolean; nav_label: string | null;
          nav_parent: string | null; page_type: string; published_at: string | null;
          published_version_id: string | null; scheduled_at: string | null;
          slug: string; status: Database["public"]["Enums"]["page_status"];
          title: string; updated_at: string; updated_by: string | null;
        };
        Insert: {
          created_at?: string; created_by?: string | null; id?: string;
          internal_name?: string; nav_in_main?: boolean; nav_label?: string | null;
          nav_parent?: string | null; page_type?: string; published_at?: string | null;
          published_version_id?: string | null; scheduled_at?: string | null;
          slug: string; status?: Database["public"]["Enums"]["page_status"];
          title: string; updated_at?: string; updated_by?: string | null;
        };
        Update: {
          created_at?: string; created_by?: string | null; id?: string;
          internal_name?: string; nav_in_main?: boolean; nav_label?: string | null;
          nav_parent?: string | null; page_type?: string; published_at?: string | null;
          published_version_id?: string | null; scheduled_at?: string | null;
          slug?: string; status?: Database["public"]["Enums"]["page_status"];
          title?: string; updated_at?: string; updated_by?: string | null;
        };
        Relationships: [];
      };
      page_versions: {
        Row: {
          blocks: Json; created_at: string; created_by: string | null; id: string;
          is_draft: boolean; page_id: string; seo: Json; updated_at: string;
          version_number: number;
        };
        Insert: {
          blocks?: Json; created_at?: string; created_by?: string | null; id?: string;
          is_draft?: boolean; page_id: string; seo?: Json; updated_at?: string;
          version_number: number;
        };
        Update: {
          blocks?: Json; created_at?: string; created_by?: string | null; id?: string;
          is_draft?: boolean; page_id?: string; seo?: Json; updated_at?: string;
          version_number?: number;
        };
        Relationships: [];
      };
      permission_modules: {
        Row: {
          created_at: string;
          description: string;
          display_order: number;
          id: string;
          label: string;
          sensitive: boolean;
        };
        Insert: {
          created_at?: string;
          description?: string;
          display_order?: number;
          id: string;
          label: string;
          sensitive?: boolean;
        };
        Update: {
          created_at?: string;
          description?: string;
          display_order?: number;
          id?: string;
          label?: string;
          sensitive?: boolean;
        };
        Relationships: [];
      };
      role_grants: {
        Row: {
          level: Database["public"]["Enums"]["access_level"];
          module_id: string;
          role_id: string;
          updated_at: string;
        };
        Insert: {
          level?: Database["public"]["Enums"]["access_level"];
          module_id: string;
          role_id: string;
          updated_at?: string;
        };
        Update: {
          level?: Database["public"]["Enums"]["access_level"];
          module_id?: string;
          role_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      schema_migrations: {
        Row: { applied_at: string; applied_by: string; name: string; version: string };
        Insert: { applied_at?: string; applied_by?: string; name: string; version: string };
        Update: { applied_at?: string; applied_by?: string; name?: string; version?: string };
        Relationships: [];
      };
      security_policies: {
        Row: {
          geo_fencing_enabled: boolean;
          geo_regions: string[];
          id: boolean;
          ip_allow_list: string[];
          password_rules: Json;
          session_timeout_minutes: number;
          totp_enforcement: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          geo_fencing_enabled?: boolean;
          geo_regions?: string[];
          id?: boolean;
          ip_allow_list?: string[];
          password_rules?: Json;
          session_timeout_minutes?: number;
          totp_enforcement?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          geo_fencing_enabled?: boolean;
          geo_regions?: string[];
          id?: boolean;
          ip_allow_list?: string[];
          password_rules?: Json;
          session_timeout_minutes?: number;
          totp_enforcement?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          budget_spent: number; budget_total: number; created_at: string;
          description: string; featured: boolean; icon: string; id: string;
          lead_id: string | null; name: string; organization_id: string;
          slug: string; stage: string; start_date: string | null;
          status: Database["public"]["Enums"]["project_status"];
          target_end: string | null; tone: string; updated_at: string;
        };
        Insert: {
          budget_spent?: number; budget_total?: number; created_at?: string;
          description?: string; featured?: boolean; icon?: string; id?: string;
          lead_id?: string | null; name: string; organization_id: string;
          slug: string; stage?: string; start_date?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          target_end?: string | null; tone?: string; updated_at?: string;
        };
        Update: {
          budget_spent?: number; budget_total?: number; created_at?: string;
          description?: string; featured?: boolean; icon?: string; id?: string;
          lead_id?: string | null; name?: string; organization_id?: string;
          slug?: string; stage?: string; start_date?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          target_end?: string | null; tone?: string; updated_at?: string;
        };
        Relationships: [];
      };
      project_milestones: {
        Row: {
          created_at: string; description: string; display_order: number;
          due_date: string | null; id: string; lead_id: string | null;
          phase: string; progress: number | null; project_id: string;
          status: Database["public"]["Enums"]["milestone_status"];
          title: string; updated_at: string;
        };
        Insert: {
          created_at?: string; description?: string; display_order?: number;
          due_date?: string | null; id?: string; lead_id?: string | null;
          phase: string; progress?: number | null; project_id: string;
          status?: Database["public"]["Enums"]["milestone_status"];
          title: string; updated_at?: string;
        };
        Update: {
          created_at?: string; description?: string; display_order?: number;
          due_date?: string | null; id?: string; lead_id?: string | null;
          phase?: string; progress?: number | null; project_id?: string;
          status?: Database["public"]["Enums"]["milestone_status"];
          title?: string; updated_at?: string;
        };
        Relationships: [];
      };
      project_tasks: {
        Row: {
          assignee_id: string | null; awaiting_approval: boolean;
          column_id: Database["public"]["Enums"]["board_column"];
          created_at: string; description: string; discipline: string;
          display_order: number; id: string; priority: boolean;
          project_id: string; title: string; updated_at: string;
        };
        Insert: {
          assignee_id?: string | null; awaiting_approval?: boolean;
          column_id?: Database["public"]["Enums"]["board_column"];
          created_at?: string; description?: string; discipline?: string;
          display_order?: number; id?: string; priority?: boolean;
          project_id: string; title: string; updated_at?: string;
        };
        Update: {
          assignee_id?: string | null; awaiting_approval?: boolean;
          column_id?: Database["public"]["Enums"]["board_column"];
          created_at?: string; description?: string; discipline?: string;
          display_order?: number; id?: string; priority?: boolean;
          project_id?: string; title?: string; updated_at?: string;
        };
        Relationships: [];
      };
      roles: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          is_system: boolean;
          name: string;
        };
        Insert: {
          created_at?: string;
          description?: string;
          id: string;
          is_system?: boolean;
          name: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          is_system?: boolean;
          name?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      invoice_totals: {
        Row: { discount: number | null; invoice_id: string | null; outstanding: number | null; paid: number | null; subtotal: number | null; tax: number | null; total: number | null };
        Relationships: [];
      };
      public_staff: {
        Row: { avatar_url: string | null; department: Database["public"]["Enums"]["department"] | null; display_order: number | null; display_role: string | null; full_name: string | null; id: string | null; skills: string[] | null; slug: string | null };
        Relationships: [];
      };
      resolved_menu_items: {
        Row: {
          badge: string | null;
          href: string | null;
          id: string | null;
          item_type: Database["public"]["Enums"]["menu_item_type"] | null;
          label: string | null;
          location: Database["public"]["Enums"]["menu_location"] | null;
          menu_id: string | null;
          open_in_new_tab: boolean | null;
          page_id: string | null;
          parent_id: string | null;
          position: number | null;
        };
        Relationships: [];
      };
      project_progress: {
        Row: {
          milestone_done: number | null;
          milestone_total: number | null;
          progress: number | null;
          project_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      publish_page: { Args: { p_page_id: string }; Returns: string };
      unpublish_page: { Args: { p_page_id: string }; Returns: undefined };
    };
    Enums: {
      access_level: "none" | "audit" | "view" | "edit" | "admin" | "full";
      board_column: "backlog" | "in-progress" | "review" | "done";
      media_kind: "image" | "video" | "document" | "logo";
      page_status: "draft" | "published" | "scheduled" | "unpublished" | "archived";
      menu_location: "header" | "footer" | "mobile" | "utility";
      menu_item_type: "page" | "external" | "anchor";
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "void";
      department: "Architectural Council" | "Growth Operations" | "Creative Engineering" | "Core Engineering";
      milestone_status: "done" | "active" | "upcoming" | "final";
      project_status: "Active" | "On Hold" | "Completed" | "Archived";
      portal: "ADMIN" | "STAFF" | "CLIENT";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Portal = Database["public"]["Enums"]["portal"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Role = Database["public"]["Tables"]["roles"]["Row"];
