/**
 * Generated from the live schema - do not edit above the aliases block.
 *
 * Regenerate with the Supabase types tool, then run:
 *   python scripts/apply-types.py <payload.json>
 */
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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      api_credentials: {
        Row: {
          created_at: string
          created_by: string | null
          environment: Database["public"]["Enums"]["credential_environment"]
          id: string
          is_enabled: boolean
          key_prefix: string
          last_rotated_at: string
          last_used_at: string | null
          last4: string
          name: string
          notes: string | null
          owner_id: string | null
          provider: string
          rotation_interval_days: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          environment?: Database["public"]["Enums"]["credential_environment"]
          id?: string
          is_enabled?: boolean
          key_prefix?: string
          last_rotated_at?: string
          last_used_at?: string | null
          last4: string
          name: string
          notes?: string | null
          owner_id?: string | null
          provider: string
          rotation_interval_days?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          environment?: Database["public"]["Enums"]["credential_environment"]
          id?: string
          is_enabled?: boolean
          key_prefix?: string
          last_rotated_at?: string
          last_used_at?: string | null
          last4?: string
          name?: string
          notes?: string | null
          owner_id?: string | null
          provider?: string
          rotation_interval_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_credentials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_credentials_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_name: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          metadata: Json
          severity: string
          summary: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          metadata?: Json
          severity?: string
          summary: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          metadata?: Json
          severity?: string
          summary?: string
        }
        Relationships: []
      }
      capabilities: {
        Row: {
          created_at: string
          description: string
          display_order: number
          id: string
          is_high_risk: boolean
          label: string
          minimum_level: Database["public"]["Enums"]["access_level"]
          module_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          display_order?: number
          id: string
          is_high_risk?: boolean
          label: string
          minimum_level: Database["public"]["Enums"]["access_level"]
          module_id: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          is_high_risk?: boolean
          label?: string
          minimum_level?: Database["public"]["Enums"]["access_level"]
          module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "capabilities_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "permission_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          position: number
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          position?: number
          quantity?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          position?: number
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_totals"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          method: string
          paid_at: string
          recorded_by: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          method?: string
          paid_at?: string
          recorded_by?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string
          paid_at?: string
          recorded_by?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_totals"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          discount_pct: number
          due_date: string | null
          id: string
          issue_date: string
          notes: string | null
          number: string
          organization_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          tax_pct: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          discount_pct?: number
          due_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          number: string
          organization_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
          tax_pct?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          discount_pct?: number
          due_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          number?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          tax_pct?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "client_project_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "client_revenue"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      isolation_policies: {
        Row: {
          description: string
          enabled: boolean
          id: string
          label: string
          module_id: string | null
          tone: string
          updated_at: string
        }
        Insert: {
          description?: string
          enabled?: boolean
          id: string
          label: string
          module_id?: string | null
          tone?: string
          updated_at?: string
        }
        Update: {
          description?: string
          enabled?: boolean
          id?: string
          label?: string
          module_id?: string | null
          tone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "isolation_policies_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "permission_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_rankings: {
        Row: {
          created_at: string
          id: string
          keyword_id: string
          position: number
          recorded_on: string
          source: string
        }
        Insert: {
          created_at?: string
          id?: string
          keyword_id: string
          position: number
          recorded_on?: string
          source?: string
        }
        Update: {
          created_at?: string
          id?: string
          keyword_id?: string
          position?: number
          recorded_on?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "keyword_rankings_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keyword_positions"
            referencedColumns: ["keyword_id"]
          },
          {
            foreignKeyName: "keyword_rankings_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "seo_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assignee_id: string | null
          brief: string
          closed_at: string | null
          company: string | null
          contacted_at: string | null
          created_at: string
          currency: string
          email: string
          estimated_value: number | null
          full_name: string
          id: string
          notes: string | null
          organization_id: string | null
          phone: string | null
          project_title: string | null
          reference: string | null
          service_intent: string | null
          service_page_id: string | null
          source: string
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          brief?: string
          closed_at?: string | null
          company?: string | null
          contacted_at?: string | null
          created_at?: string
          currency?: string
          email: string
          estimated_value?: number | null
          full_name: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          project_title?: string | null
          reference?: string | null
          service_intent?: string | null
          service_page_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          brief?: string
          closed_at?: string | null
          company?: string | null
          contacted_at?: string | null
          created_at?: string
          currency?: string
          email?: string
          estimated_value?: number | null
          full_name?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          project_title?: string | null
          reference?: string | null
          service_intent?: string | null
          service_page_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "client_project_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "client_revenue"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_service_page_id_fkey"
            columns: ["service_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string
          filename: string
          folder: string
          height: number | null
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          mime_type: string
          public_url: string
          size_bytes: number
          storage_path: string
          title: string | null
          updated_at: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          filename: string
          folder?: string
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          mime_type: string
          public_url: string
          size_bytes?: number
          storage_path: string
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          filename?: string
          folder?: string
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          mime_type?: string
          public_url?: string
          size_bytes?: number
          storage_path?: string
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          badge: string | null
          created_at: string
          external_url: string | null
          id: string
          is_visible: boolean
          item_type: Database["public"]["Enums"]["menu_item_type"]
          label: string
          menu_id: string
          open_in_new_tab: boolean
          page_id: string | null
          parent_id: string | null
          position: number
          updated_at: string
        }
        Insert: {
          badge?: string | null
          created_at?: string
          external_url?: string | null
          id?: string
          is_visible?: boolean
          item_type?: Database["public"]["Enums"]["menu_item_type"]
          label: string
          menu_id: string
          open_in_new_tab?: boolean
          page_id?: string | null
          parent_id?: string | null
          position?: number
          updated_at?: string
        }
        Update: {
          badge?: string | null
          created_at?: string
          external_url?: string | null
          id?: string
          is_visible?: boolean
          item_type?: Database["public"]["Enums"]["menu_item_type"]
          label?: string
          menu_id?: string
          open_in_new_tab?: boolean
          page_id?: string | null
          parent_id?: string | null
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "resolved_menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          created_at: string
          id: string
          location: Database["public"]["Enums"]["menu_location"] | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: Database["public"]["Enums"]["menu_location"] | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: Database["public"]["Enums"]["menu_location"] | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          account_manager_id: string | null
          created_at: string
          health: Database["public"]["Enums"]["account_health"]
          id: string
          industry: string | null
          name: string
          notes: string | null
          renews_on: string | null
          slug: string
          tier: string
          updated_at: string
          website: string | null
        }
        Insert: {
          account_manager_id?: string | null
          created_at?: string
          health?: Database["public"]["Enums"]["account_health"]
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          renews_on?: string | null
          slug: string
          tier?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          account_manager_id?: string | null
          created_at?: string
          health?: Database["public"]["Enums"]["account_health"]
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          renews_on?: string | null
          slug?: string
          tier?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_account_manager_id_fkey"
            columns: ["account_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_templates: {
        Row: {
          blocks: Json
          category: string
          created_at: string
          description: string
          display_order: number
          id: string
          is_system: boolean
          name: string
          preview_url: string | null
          updated_at: string
        }
        Insert: {
          blocks?: Json
          category?: string
          created_at?: string
          description?: string
          display_order?: number
          id: string
          is_system?: boolean
          name: string
          preview_url?: string | null
          updated_at?: string
        }
        Update: {
          blocks?: Json
          category?: string
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          is_system?: boolean
          name?: string
          preview_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      page_versions: {
        Row: {
          blocks: Json
          created_at: string
          created_by: string | null
          id: string
          is_draft: boolean
          page_id: string
          seo: Json
          updated_at: string
          version_number: number
        }
        Insert: {
          blocks?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_draft?: boolean
          page_id: string
          seo?: Json
          updated_at?: string
          version_number: number
        }
        Update: {
          blocks?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_draft?: boolean
          page_id?: string
          seo?: Json
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "page_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_versions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          internal_name: string
          nav_in_main: boolean
          nav_label: string | null
          nav_parent: string | null
          page_type: string
          published_at: string | null
          published_version_id: string | null
          scheduled_at: string | null
          slug: string
          status: Database["public"]["Enums"]["page_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          internal_name?: string
          nav_in_main?: boolean
          nav_label?: string | null
          nav_parent?: string | null
          page_type?: string
          published_at?: string | null
          published_version_id?: string | null
          scheduled_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["page_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          internal_name?: string
          nav_in_main?: boolean
          nav_label?: string | null
          nav_parent?: string | null
          page_type?: string
          published_at?: string | null
          published_version_id?: string | null
          scheduled_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["page_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_published_version_fk"
            columns: ["published_version_id"]
            isOneToOne: false
            referencedRelation: "page_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_modules: {
        Row: {
          created_at: string
          description: string
          display_order: number
          id: string
          label: string
          sensitive: boolean
        }
        Insert: {
          created_at?: string
          description?: string
          display_order?: number
          id: string
          label: string
          sensitive?: boolean
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          label?: string
          sensitive?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          job_title: string | null
          last_seen_at: string | null
          locale: string
          organization_id: string | null
          phone: string | null
          portal: Database["public"]["Enums"]["portal"]
          role_id: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name?: string
          id: string
          is_active?: boolean
          job_title?: string | null
          last_seen_at?: string | null
          locale?: string
          organization_id?: string | null
          phone?: string | null
          portal?: Database["public"]["Enums"]["portal"]
          role_id?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          last_seen_at?: string | null
          locale?: string
          organization_id?: string | null
          phone?: string | null
          portal?: Database["public"]["Enums"]["portal"]
          role_id?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "client_project_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "client_revenue"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "role_capabilities"
            referencedColumns: ["role_id"]
          },
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_assignments: {
        Row: {
          created_at: string
          ends_on: string | null
          hours_per_week: number
          id: string
          profile_id: string
          project_id: string
          role_on_project: string
          starts_on: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_on?: string | null
          hours_per_week?: number
          id?: string
          profile_id: string
          project_id: string
          role_on_project?: string
          starts_on?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_on?: string | null
          hours_per_week?: number
          id?: string
          profile_id?: string
          project_id?: string
          role_on_project?: string
          starts_on?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "service_delivery_history"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          created_at: string
          description: string
          display_order: number
          due_date: string | null
          id: string
          lead_id: string | null
          phase: string
          progress: number | null
          project_id: string
          status: Database["public"]["Enums"]["milestone_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          display_order?: number
          due_date?: string | null
          id?: string
          lead_id?: string | null
          phase: string
          progress?: number | null
          project_id: string
          status?: Database["public"]["Enums"]["milestone_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          due_date?: string | null
          id?: string
          lead_id?: string | null
          phase?: string
          progress?: number | null
          project_id?: string
          status?: Database["public"]["Enums"]["milestone_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "service_delivery_history"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_services: {
        Row: {
          created_at: string
          project_id: string
          service_page_id: string
        }
        Insert: {
          created_at?: string
          project_id: string
          service_page_id: string
        }
        Update: {
          created_at?: string
          project_id?: string
          service_page_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_services_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_services_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_services_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "service_delivery_history"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_services_service_page_id_fkey"
            columns: ["service_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assignee_id: string | null
          awaiting_approval: boolean
          column_id: Database["public"]["Enums"]["board_column"]
          created_at: string
          description: string
          discipline: string
          display_order: number
          id: string
          priority: boolean
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          awaiting_approval?: boolean
          column_id?: Database["public"]["Enums"]["board_column"]
          created_at?: string
          description?: string
          discipline?: string
          display_order?: number
          id?: string
          priority?: boolean
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          awaiting_approval?: boolean
          column_id?: Database["public"]["Enums"]["board_column"]
          created_at?: string
          description?: string
          discipline?: string
          display_order?: number
          id?: string
          priority?: boolean
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "service_delivery_history"
            referencedColumns: ["project_id"]
          },
        ]
      }
      projects: {
        Row: {
          budget_spent: number
          budget_total: number
          case_study_page_id: string | null
          created_at: string
          description: string
          featured: boolean
          icon: string
          id: string
          lead_id: string | null
          name: string
          organization_id: string
          reference: string | null
          slug: string
          stage: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          target_end: string | null
          tone: string
          updated_at: string
        }
        Insert: {
          budget_spent?: number
          budget_total?: number
          case_study_page_id?: string | null
          created_at?: string
          description?: string
          featured?: boolean
          icon?: string
          id?: string
          lead_id?: string | null
          name: string
          organization_id: string
          reference?: string | null
          slug: string
          stage?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          target_end?: string | null
          tone?: string
          updated_at?: string
        }
        Update: {
          budget_spent?: number
          budget_total?: number
          case_study_page_id?: string | null
          created_at?: string
          description?: string
          featured?: boolean
          icon?: string
          id?: string
          lead_id?: string | null
          name?: string
          organization_id?: string
          reference?: string | null
          slug?: string
          stage?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          target_end?: string | null
          tone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_case_study_page_id_fkey"
            columns: ["case_study_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "client_project_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "client_revenue"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_company: string | null
          author_id: string | null
          author_name: string
          author_role: string | null
          body: string
          created_at: string
          display_order: number
          id: string
          is_featured: boolean
          moderated_at: string | null
          moderated_by: string | null
          moderation_note: string | null
          organization_id: string | null
          project_id: string | null
          rating: number
          status: Database["public"]["Enums"]["review_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          author_company?: string | null
          author_id?: string | null
          author_name: string
          author_role?: string | null
          body: string
          created_at?: string
          display_order?: number
          id?: string
          is_featured?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          organization_id?: string | null
          project_id?: string | null
          rating: number
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_company?: string | null
          author_id?: string | null
          author_name?: string
          author_role?: string | null
          body?: string
          created_at?: string
          display_order?: number
          id?: string
          is_featured?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          organization_id?: string | null
          project_id?: string | null
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "client_project_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "client_revenue"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "service_delivery_history"
            referencedColumns: ["project_id"]
          },
        ]
      }
      role_grants: {
        Row: {
          level: Database["public"]["Enums"]["access_level"]
          module_id: string
          role_id: string
          updated_at: string
        }
        Insert: {
          level?: Database["public"]["Enums"]["access_level"]
          module_id: string
          role_id: string
          updated_at?: string
        }
        Update: {
          level?: Database["public"]["Enums"]["access_level"]
          module_id?: string
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_grants_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "permission_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_grants_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "role_capabilities"
            referencedColumns: ["role_id"]
          },
          {
            foreignKeyName: "role_grants_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          accent: string | null
          created_at: string
          description: string
          id: string
          is_system: boolean
          level: number | null
          name: string
          required_clearance: number | null
          required_skills: string[]
          tags: string[]
        }
        Insert: {
          accent?: string | null
          created_at?: string
          description?: string
          id: string
          is_system?: boolean
          level?: number | null
          name: string
          required_clearance?: number | null
          required_skills?: string[]
          tags?: string[]
        }
        Update: {
          accent?: string | null
          created_at?: string
          description?: string
          id?: string
          is_system?: boolean
          level?: number | null
          name?: string
          required_clearance?: number | null
          required_skills?: string[]
          tags?: string[]
        }
        Relationships: []
      }
      schema_migrations: {
        Row: {
          applied_at: string
          applied_by: string
          name: string
          version: string
        }
        Insert: {
          applied_at?: string
          applied_by?: string
          name: string
          version: string
        }
        Update: {
          applied_at?: string
          applied_by?: string
          name?: string
          version?: string
        }
        Relationships: []
      }
      security_policies: {
        Row: {
          geo_fencing_enabled: boolean
          geo_regions: string[]
          id: boolean
          inherit_permissions: boolean
          ip_allow_list: string[]
          password_rules: Json
          session_timeout_minutes: number
          totp_enforcement: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          geo_fencing_enabled?: boolean
          geo_regions?: string[]
          id?: boolean
          inherit_permissions?: boolean
          ip_allow_list?: string[]
          password_rules?: Json
          session_timeout_minutes?: number
          totp_enforcement?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          geo_fencing_enabled?: boolean
          geo_regions?: string[]
          id?: boolean
          inherit_permissions?: boolean
          ip_allow_list?: string[]
          password_rules?: Json
          session_timeout_minutes?: number
          totp_enforcement?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_policies_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_keywords: {
        Row: {
          created_at: string
          created_by: string | null
          difficulty: number | null
          id: string
          intent: Database["public"]["Enums"]["keyword_intent"]
          notes: string | null
          page_id: string | null
          search_volume: number | null
          target_url: string | null
          term: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          difficulty?: number | null
          id?: string
          intent?: Database["public"]["Enums"]["keyword_intent"]
          notes?: string | null
          page_id?: string | null
          search_volume?: number | null
          target_url?: string | null
          term: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          difficulty?: number | null
          id?: string
          intent?: Database["public"]["Enums"]["keyword_intent"]
          notes?: string | null
          page_id?: string | null
          search_volume?: number | null
          target_url?: string | null
          term?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_keywords_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_keywords_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      service_details: {
        Row: {
          category: string
          cover_image_alt: string | null
          cover_image_url: string | null
          created_at: string
          currency: string
          display_order: number
          is_featured: boolean
          lead_time_weeks: number | null
          page_id: string
          price_from: number | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          display_order?: number
          is_featured?: boolean
          lead_time_weeks?: number | null
          page_id: string
          price_from?: number | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          display_order?: number
          is_featured?: boolean
          lead_time_weeks?: number | null
          page_id?: string
          price_from?: number | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_details_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: true
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          body_start_scripts: string | null
          default_title: string | null
          ga4_measurement_id: string | null
          gtm_container_id: string | null
          header_scripts: string | null
          homepage_page_id: string | null
          id: boolean
          meta_description: string | null
          og_image_alt: string | null
          og_image_url: string | null
          site_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body_start_scripts?: string | null
          default_title?: string | null
          ga4_measurement_id?: string | null
          gtm_container_id?: string | null
          header_scripts?: string | null
          homepage_page_id?: string | null
          id?: boolean
          meta_description?: string | null
          og_image_alt?: string | null
          og_image_url?: string | null
          site_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body_start_scripts?: string | null
          default_title?: string | null
          ga4_measurement_id?: string | null
          gtm_container_id?: string | null
          header_scripts?: string | null
          homepage_page_id?: string | null
          id?: boolean
          meta_description?: string | null
          og_image_alt?: string | null
          og_image_url?: string | null
          site_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_homepage_page_id_fkey"
            columns: ["homepage_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_profiles: {
        Row: {
          created_at: string
          department: Database["public"]["Enums"]["department"] | null
          display_order: number
          display_role: string
          id: string
          is_billable: boolean
          is_public: boolean
          seniority: string | null
          skills: string[]
          slug: string
          updated_at: string
          weekly_capacity_hours: number
        }
        Insert: {
          created_at?: string
          department?: Database["public"]["Enums"]["department"] | null
          display_order?: number
          display_role?: string
          id: string
          is_billable?: boolean
          is_public?: boolean
          seniority?: string | null
          skills?: string[]
          slug: string
          updated_at?: string
          weekly_capacity_hours?: number
        }
        Update: {
          created_at?: string
          department?: Database["public"]["Enums"]["department"] | null
          display_order?: number
          display_role?: string
          id?: string
          is_billable?: boolean
          is_public?: boolean
          seniority?: string | null
          skills?: string[]
          slug?: string
          updated_at?: string
          weekly_capacity_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      temporary_grants: {
        Row: {
          created_at: string
          expires_at: string
          granted_by: string | null
          id: string
          level: Database["public"]["Enums"]["access_level"]
          module_id: string
          profile_id: string
          reason: string
          revoked_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          granted_by?: string | null
          id?: string
          level: Database["public"]["Enums"]["access_level"]
          module_id: string
          profile_id: string
          reason?: string
          revoked_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          granted_by?: string | null
          id?: string
          level?: Database["public"]["Enums"]["access_level"]
          module_id?: string
          profile_id?: string
          reason?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "temporary_grants_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temporary_grants_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "permission_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temporary_grants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_temporary_grants: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_by: string | null
          id: string | null
          level: Database["public"]["Enums"]["access_level"] | null
          module_id: string | null
          profile_id: string | null
          reason: string | null
          seconds_remaining: number | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_by?: string | null
          id?: string | null
          level?: Database["public"]["Enums"]["access_level"] | null
          module_id?: string | null
          profile_id?: string | null
          reason?: string | null
          seconds_remaining?: never
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_by?: string | null
          id?: string | null
          level?: Database["public"]["Enums"]["access_level"] | null
          module_id?: string | null
          profile_id?: string | null
          reason?: string | null
          seconds_remaining?: never
        }
        Relationships: [
          {
            foreignKeyName: "temporary_grants_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temporary_grants_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "permission_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temporary_grants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_project_counts: {
        Row: {
          active_project_count: number | null
          organization_id: string | null
          project_count: number | null
        }
        Relationships: []
      }
      client_revenue: {
        Row: {
          billed_total: number | null
          collected_total: number | null
          invoice_count: number | null
          monthly_average: number | null
          organization_id: string | null
          outstanding_total: number | null
        }
        Relationships: []
      }
      credential_rotation: {
        Row: {
          age_days: number | null
          credential_id: string | null
          days_remaining: number | null
          due_at: string | null
          rotation_state: string | null
        }
        Insert: {
          age_days?: never
          credential_id?: string | null
          days_remaining?: never
          due_at?: never
          rotation_state?: never
        }
        Update: {
          age_days?: never
          credential_id?: string | null
          days_remaining?: never
          due_at?: never
          rotation_state?: never
        }
        Relationships: []
      }
      invoice_totals: {
        Row: {
          discount: number | null
          invoice_id: string | null
          outstanding: number | null
          paid: number | null
          subtotal: number | null
          tax: number | null
          total: number | null
        }
        Relationships: []
      }
      keyword_positions: {
        Row: {
          current_position: number | null
          keyword_id: string | null
          measured_on: string | null
          movement: number | null
          previous_position: number | null
        }
        Relationships: []
      }
      lead_pipeline: {
        Row: {
          contacted_count: number | null
          conversion_pct: number | null
          lost_count: number | null
          new_count: number | null
          open_count: number | null
          open_value: number | null
          qualified_count: number | null
          total: number | null
          unsized_count: number | null
          won_count: number | null
          won_value: number | null
        }
        Relationships: []
      }
      project_progress: {
        Row: {
          milestone_done: number | null
          milestone_total: number | null
          progress: number | null
          project_id: string | null
        }
        Relationships: []
      }
      public_staff: {
        Row: {
          avatar_url: string | null
          department: Database["public"]["Enums"]["department"] | null
          display_order: number | null
          display_role: string | null
          full_name: string | null
          id: string | null
          skills: string[] | null
          slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resolved_menu_items: {
        Row: {
          badge: string | null
          href: string | null
          id: string | null
          item_type: Database["public"]["Enums"]["menu_item_type"] | null
          label: string | null
          location: Database["public"]["Enums"]["menu_location"] | null
          menu_id: string | null
          open_in_new_tab: boolean | null
          page_id: string | null
          parent_id: string | null
          position: number | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "resolved_menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      role_capabilities: {
        Row: {
          capability_id: string | null
          current_level: Database["public"]["Enums"]["access_level"] | null
          granted: boolean | null
          is_high_risk: boolean | null
          minimum_level: Database["public"]["Enums"]["access_level"] | null
          module_id: string | null
          role_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "capabilities_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "permission_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      service_delivery_history: {
        Row: {
          budget_total: number | null
          case_study_page_id: string | null
          case_study_published: boolean | null
          case_study_slug: string | null
          client_name: string | null
          name: string | null
          project_id: string | null
          reference: string | null
          service_page_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          target_end: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_services_service_page_id_fkey"
            columns: ["service_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_case_study_page_id_fkey"
            columns: ["case_study_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_utilisation: {
        Row: {
          assigned_hours: number | null
          capacity_hours: number | null
          profile_id: string | null
          project_count: number | null
          utilisation_pct: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      database_health: { Args: never; Returns: Json }
      publish_page: { Args: { p_page_id: string }; Returns: string }
      slow_queries: {
        Args: { p_limit?: number }
        Returns: {
          calls: number
          max_ms: number
          mean_ms: number
          query: string
          rows_out: number
          total_ms: number
        }[]
      }
      submit_lead: {
        Args: {
          p_brief: string
          p_company?: string
          p_email: string
          p_full_name: string
          p_phone?: string
          p_project_title?: string
          p_service_intent?: string
          p_service_page?: string
          p_source?: string
        }
        Returns: string
      }
      table_statistics: {
        Args: never
        Returns: {
          dead_rows: number
          index_scans: number
          last_analyze: string
          last_vacuum: string
          live_rows: number
          seq_scans: number
          table_name: string
          total_bytes: number
        }[]
      }
      unpublish_page: { Args: { p_page_id: string }; Returns: undefined }
    }
    Enums: {
      access_level: "none" | "audit" | "view" | "edit" | "admin" | "full"
      account_health: "onboarding" | "healthy" | "at-risk" | "churned"
      board_column: "backlog" | "in-progress" | "review" | "done"
      credential_environment: "production" | "staging" | "development"
      department:
        | "Architectural Council"
        | "Growth Operations"
        | "Creative Engineering"
        | "Core Engineering"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "void"
      keyword_intent:
        | "informational"
        | "commercial"
        | "transactional"
        | "navigational"
      lead_status: "new" | "contacted" | "qualified" | "won" | "lost"
      media_kind: "image" | "video" | "document" | "logo"
      menu_item_type: "page" | "external" | "anchor"
      menu_location: "header" | "footer" | "mobile" | "utility"
      milestone_status: "done" | "active" | "upcoming" | "final"
      page_status:
        | "draft"
        | "published"
        | "scheduled"
        | "unpublished"
        | "archived"
      portal: "ADMIN" | "STAFF" | "CLIENT"
      project_status: "Active" | "On Hold" | "Completed" | "Archived"
      review_status: "pending" | "approved" | "rejected"
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
    Enums: {
      access_level: ["none", "audit", "view", "edit", "admin", "full"],
      account_health: ["onboarding", "healthy", "at-risk", "churned"],
      board_column: ["backlog", "in-progress", "review", "done"],
      credential_environment: ["production", "staging", "development"],
      department: [
        "Architectural Council",
        "Growth Operations",
        "Creative Engineering",
        "Core Engineering",
      ],
      invoice_status: ["draft", "sent", "paid", "overdue", "void"],
      keyword_intent: [
        "informational",
        "commercial",
        "transactional",
        "navigational",
      ],
      lead_status: ["new", "contacted", "qualified", "won", "lost"],
      media_kind: ["image", "video", "document", "logo"],
      menu_item_type: ["page", "external", "anchor"],
      menu_location: ["header", "footer", "mobile", "utility"],
      milestone_status: ["done", "active", "upcoming", "final"],
      page_status: [
        "draft",
        "published",
        "scheduled",
        "unpublished",
        "archived",
      ],
      portal: ["ADMIN", "STAFF", "CLIENT"],
      project_status: ["Active", "On Hold", "Completed", "Archived"],
      review_status: ["pending", "approved", "rejected"],
    },
  },
} as const


/* --------------------------------------------------------------- aliases --
 * Hand-added below the generated block, and re-appended by the script above.
 */
export type Portal = Database["public"]["Enums"]["portal"];
export type AccessLevel = Database["public"]["Enums"]["access_level"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Role = Database["public"]["Tables"]["roles"]["Row"];
