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
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      access_level: "none" | "audit" | "view" | "edit" | "admin" | "full";
      portal: "ADMIN" | "STAFF" | "CLIENT";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Portal = Database["public"]["Enums"]["portal"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Role = Database["public"]["Tables"]["roles"]["Row"];
