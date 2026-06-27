export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      churches: {
        Row: {
          id: string;
          name: string;
          slug: string;
          default_language: string;
          timezone: string;
          country: string | null;
          city: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          logo_url: string | null;
          is_active: boolean;
          created_by_user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          default_language?: string;
          timezone?: string;
          country?: string | null;
          city?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          logo_url?: string | null;
          is_active?: boolean;
          created_by_user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          default_language?: string;
          timezone?: string;
          country?: string | null;
          city?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          logo_url?: string | null;
          is_active?: boolean;
          created_by_user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          preferred_language: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          preferred_language?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          preferred_language?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      church_users: {
        Row: {
          id: string;
          church_id: string;
          user_id: string;
          status: string;
          is_primary: boolean;
          joined_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          user_id: string;
          status?: string;
          is_primary?: boolean;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          user_id?: string;
          status?: string;
          is_primary?: boolean;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      role_definitions: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          is_system: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          is_system?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          is_system?: boolean;
          created_at?: string;
        };
      };
      church_role_assignments: {
        Row: {
          id: string;
          church_id: string;
          user_id: string;
          role_id: string;
          start_date: string | null;
          end_date: string | null;
          is_active: boolean;
          assigned_by_user_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          user_id: string;
          role_id: string;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          assigned_by_user_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          user_id?: string;
          role_id?: string;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          assigned_by_user_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      church_departments: {
        Row: {
          id: string;
          church_id: string;
          department_name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          department_name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          department_name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      members: {
        Row: {
          id: string;
          church_id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          date_of_birth: string | null;
          gender: string | null;
          address: string | null;
          city: string | null;
          country: string | null;
          baptism_date: string | null;
          membership_status: string;
          membership_type: string;
          department: string | null;
          profession: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          created_by_user_id: string | null;
          display_name: string | null;
          member_code: string | null;
          date_joined: string | null;
          transfer_in_date: string | null;
          transfer_out_date: string | null;
          deceased_date: string | null;
          household_id: string | null;
          household_role: string | null;
          previous_church: string | null;
          marital_status: string | null;
          profile_id: string | null;
          portal_invited_at: string | null;
          portal_joined_at: string | null;
        };
        Insert: {
          id?: string;
          church_id: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          baptism_date?: string | null;
          membership_status?: string;
          membership_type?: string;
          department?: string | null;
          profession?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by_user_id?: string | null;
          display_name?: string | null;
          member_code?: string | null;
          date_joined?: string | null;
          transfer_in_date?: string | null;
          transfer_out_date?: string | null;
          deceased_date?: string | null;
          household_id?: string | null;
          household_role?: string | null;
          previous_church?: string | null;
          marital_status?: string | null;
          profile_id?: string | null;
          portal_invited_at?: string | null;
          portal_joined_at?: string | null;
        };
        Update: {
          id?: string;
          church_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          baptism_date?: string | null;
          membership_status?: string;
          membership_type?: string;
          department?: string | null;
          profession?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by_user_id?: string | null;
          display_name?: string | null;
          member_code?: string | null;
          date_joined?: string | null;
          transfer_in_date?: string | null;
          transfer_out_date?: string | null;
          deceased_date?: string | null;
          household_id?: string | null;
          household_role?: string | null;
          previous_church?: string | null;
          marital_status?: string | null;
          profile_id?: string | null;
          portal_invited_at?: string | null;
          portal_joined_at?: string | null;
        };
      };
      member_departments: {
        Row: {
          id: string;
          member_id: string;
          department_name: string;
          role_in_department: string | null;
          joined_date: string | null;
          created_at: string;
          church_id: string | null;
          department_id: string | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          member_id: string;
          department_name: string;
          role_in_department?: string | null;
          joined_date?: string | null;
          created_at?: string;
          church_id?: string | null;
          department_id?: string | null;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          member_id?: string;
          department_name?: string;
          role_in_department?: string | null;
          joined_date?: string | null;
          created_at?: string;
          church_id?: string | null;
          department_id?: string | null;
          is_active?: boolean | null;
        };
      };
      member_status_history: {
        Row: {
          id: string;
          church_id: string;
          member_id: string;
          old_status: string | null;
          new_status: string;
          reason: string | null;
          changed_by_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          member_id: string;
          old_status?: string | null;
          new_status: string;
          reason?: string | null;
          changed_by_user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          member_id?: string;
          old_status?: string | null;
          new_status?: string;
          reason?: string | null;
          changed_by_user_id?: string;
          created_at?: string;
        };
      };
      households: {
        Row: {
          id: string;
          church_id: string;
          household_name: string;
          address: string | null;
          city: string | null;
          country: string | null;
          phone: string | null;
          email: string | null;
          head_of_household_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          created_by_user_id: string | null;
        };
        Insert: {
          id?: string;
          church_id: string;
          household_name: string;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          phone?: string | null;
          email?: string | null;
          head_of_household_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by_user_id?: string | null;
        };
        Update: {
          id?: string;
          church_id?: string;
          household_name?: string;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          phone?: string | null;
          email?: string | null;
          head_of_household_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by_user_id?: string | null;
        };
      };
      // ============================================
      // COMMERCE TABLES - Aligned with Live DB Schema
      // ============================================
      products: {
        Row: {
          id: string;
          church_id: string;
          name: string;
          description: string | null;
          price_cents: number;
          stock_quantity: number;
          is_active: boolean;
          badge_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          name: string;
          description?: string | null;
          price_cents?: number;
          stock_quantity?: number;
          is_active?: boolean;
          badge_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          name?: string;
          description?: string | null;
          price_cents?: number;
          stock_quantity?: number;
          is_active?: boolean;
          badge_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      offers: {
        Row: {
          id: string;
          church_id: string;
          name: string;
          description: string | null;
          discount_percent: number | null;
          discount_cents: number | null;
          start_date: string | null;
          end_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          name: string;
          description?: string | null;
          discount_percent?: number | null;
          discount_cents?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          name?: string;
          description?: string | null;
          discount_percent?: number | null;
          discount_cents?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      offer_products: {
        Row: {
          id: string;
          offer_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          offer_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          offer_id?: string;
          product_id?: string;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          church_id: string;
          member_id: string;
          code: string;
          status: string;
          payment_method: string;
          total_cents: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          member_id: string;
          code: string;
          status?: string;
          payment_method: string;
          total_cents: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          member_id?: string;
          code?: string;
          status?: string;
          payment_method?: string;
          total_cents?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price_cents: number;
          total_price_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price_cents: number;
          total_price_cents: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price_cents?: number;
          total_price_cents?: number;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          method: string;
          amount_cents: number;
          balance_due_cents: number;
          status: string;
          reference_number: string | null;
          gcash_ref: string | null;
          proof_url: string | null;
          verified_at: string | null;
          verified_by: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          method: string;
          amount_cents: number;
          balance_due_cents?: number;
          status?: string;
          reference_number?: string | null;
          gcash_ref?: string | null;
          proof_url?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          method?: string;
          amount_cents?: number;
          balance_due_cents?: number;
          status?: string;
          reference_number?: string | null;
          gcash_ref?: string | null;
          proof_url?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      printing_requests: {
        Row: {
          id: string;
          church_id: string;
          member_id: string;
          pdf_url: string | null;
          status: string;
          quantity: number;
          paper_size: string;
          color_mode: string;
          notes: string | null;
          staff_notes: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          member_id: string;
          pdf_url?: string | null;
          status?: string;
          quantity?: number;
          paper_size?: string;
          color_mode?: string;
          notes?: string | null;
          staff_notes?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          member_id?: string;
          pdf_url?: string | null;
          status?: string;
          quantity?: number;
          paper_size?: string;
          color_mode?: string;
          notes?: string | null;
          staff_notes?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Permission and Access Control
      permission_definitions: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          is_system: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          is_system?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          is_system?: boolean;
          created_at?: string;
        };
      };
      church_permission_assignments: {
        Row: {
          id: string;
          church_id: string;
          user_id: string;
          permission_id: string;
          is_active: boolean;
          granted_by_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          user_id: string;
          permission_id: string;
          is_active?: boolean;
          granted_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          user_id?: string;
          permission_id?: string;
          is_active?: boolean;
          granted_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      access_control_audit_logs: {
        Row: {
          id: string;
          church_id: string;
          target_user_id: string;
          actor_user_id: string | null;
          action_type: string;
          role_id: string | null;
          permission_id: string | null;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          target_user_id: string;
          actor_user_id?: string | null;
          action_type: string;
          role_id?: string | null;
          permission_id?: string | null;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          target_user_id?: string;
          actor_user_id?: string | null;
          action_type?: string;
          role_id?: string | null;
          permission_id?: string | null;
          payload?: Json;
          created_at?: string;
        };
      };
      church_access_requests: {
        Row: {
          id: string;
          church_id: string;
          invite_id: string | null;
          user_id: string | null;
          member_id: string | null;
          requested_role_id: string | null;
          requested_role_code: string | null;
          requested_role_name: string;
          status: string;
          requested_at: string;
          reviewed_at: string | null;
          reviewed_by_user_id: string | null;
          reviewer_note: string | null;
          source: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          invite_id?: string | null;
          user_id?: string | null;
          member_id?: string | null;
          requested_role_id?: string | null;
          requested_role_code?: string | null;
          requested_role_name: string;
          status?: string;
          requested_at?: string;
          reviewed_at?: string | null;
          reviewed_by_user_id?: string | null;
          reviewer_note?: string | null;
          source?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          invite_id?: string | null;
          user_id?: string | null;
          member_id?: string | null;
          requested_role_id?: string | null;
          requested_role_code?: string | null;
          requested_role_name?: string;
          status?: string;
          requested_at?: string;
          reviewed_at?: string | null;
          reviewed_by_user_id?: string | null;
          reviewer_note?: string | null;
          source?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Events
      church_events: {
        Row: {
          id: string;
          church_id: string;
          title: string;
          description: string | null;
          event_type: string;
          department_id: string | null;
          location: string | null;
          start_datetime: string;
          end_datetime: string;
          is_all_day: boolean;
          status: string;
          created_by_user_id: string;
          created_at: string;
          updated_at: string;
          workflow_state: string;
          submitted_by_user_id: string | null;
          submitted_at: string | null;
          approved_by_user_id: string | null;
          approved_at: string | null;
          approval_note: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          church_id: string;
          title: string;
          description?: string | null;
          event_type: string;
          department_id?: string | null;
          location?: string | null;
          start_datetime: string;
          end_datetime: string;
          is_all_day?: boolean;
          status?: string;
          created_by_user_id: string;
          created_at?: string;
          updated_at?: string;
          workflow_state?: string;
          submitted_by_user_id?: string | null;
          submitted_at?: string | null;
          approved_by_user_id?: string | null;
          approved_at?: string | null;
          approval_note?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          church_id?: string;
          title?: string;
          description?: string | null;
          event_type?: string;
          department_id?: string | null;
          location?: string | null;
          start_datetime?: string;
          end_datetime?: string;
          is_all_day?: boolean;
          status?: string;
          created_by_user_id?: string;
          created_at?: string;
          updated_at?: string;
          workflow_state?: string;
          submitted_by_user_id?: string | null;
          submitted_at?: string | null;
          approved_by_user_id?: string | null;
          approved_at?: string | null;
          approval_note?: string | null;
          metadata?: Json;
        };
      };
      church_event_departments: {
        Row: {
          id: string;
          church_id: string;
          event_id: string;
          department_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          event_id: string;
          department_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          event_id?: string;
          department_id?: string;
          created_at?: string;
        };
      };
      // Announcements
      church_announcements: {
        Row: {
          id: string;
          church_id: string;
          department_id: string | null;
          title: string;
          body: string;
          audience_scope: string;
          status: string;
          requires_acknowledgement: boolean;
          published_at: string | null;
          expires_at: string | null;
          created_by_user_id: string | null;
          approved_by_user_id: string | null;
          approval_note: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          department_id?: string | null;
          title: string;
          body: string;
          audience_scope?: string;
          status?: string;
          requires_acknowledgement?: boolean;
          published_at?: string | null;
          expires_at?: string | null;
          created_by_user_id?: string | null;
          approved_by_user_id?: string | null;
          approval_note?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          department_id?: string | null;
          title?: string;
          body?: string;
          audience_scope?: string;
          status?: string;
          requires_acknowledgement?: boolean;
          published_at?: string | null;
          expires_at?: string | null;
          created_by_user_id?: string | null;
          approved_by_user_id?: string | null;
          approval_note?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      department_fund_requests: {
        Row: {
          id: string;
          church_id: string;
          department_id: string;
          requested_by_user_id: string;
          title: string;
          purpose: string;
          amount: number;
          outflow_type: string;
          fund_id: string | null;
          outflow_date: string;
          reference_number: string | null;
          event_id: string | null;
          preferred_fund_id: string | null;
          payee: string | null;
          project_name: string | null;
          note: string | null;
          requested_date: string;
          status: string;
          treasury_decision_note: string | null;
          treasury_reviewed_by_user_id: string | null;
          treasury_reviewed_at: string | null;
          processed_outflow_id: string | null;
          processed_by_user_id: string | null;
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          department_id: string;
          requested_by_user_id: string;
          title: string;
          purpose: string;
          amount: number;
          outflow_type: string;
          fund_id?: string | null;
          outflow_date: string;
          reference_number?: string | null;
          event_id?: string | null;
          preferred_fund_id?: string | null;
          payee?: string | null;
          project_name?: string | null;
          note?: string | null;
          requested_date: string;
          status?: string;
          treasury_decision_note?: string | null;
          treasury_reviewed_by_user_id?: string | null;
          treasury_reviewed_at?: string | null;
          processed_outflow_id?: string | null;
          processed_by_user_id?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          department_id?: string;
          requested_by_user_id?: string;
          title?: string;
          purpose?: string;
          amount?: number;
          outflow_type?: string;
          fund_id?: string | null;
          outflow_date?: string;
          reference_number?: string | null;
          event_id?: string | null;
          preferred_fund_id?: string | null;
          payee?: string | null;
          project_name?: string | null;
          note?: string | null;
          requested_date?: string;
          status?: string;
          treasury_decision_note?: string | null;
          treasury_reviewed_by_user_id?: string | null;
          treasury_reviewed_at?: string | null;
          processed_outflow_id?: string | null;
          processed_by_user_id?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Treasury
      treasury_funds: {
        Row: {
          id: string;
          church_id: string;
          department_id: string | null;
          code: string;
          name: string;
          fund_type: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          department_id?: string | null;
          code: string;
          name: string;
          fund_type: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          department_id?: string | null;
          code?: string;
          name?: string;
          fund_type?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      treasury_inflows: {
        Row: {
          id: string;
          church_id: string;
          member_id: string | null;
          department_id: string | null;
          fund_id: string;
          inflow_type: string;
          amount: number;
          inflow_date: string;
          is_anonymous: boolean;
          note: string | null;
          reference_number: string | null;
          recorded_by_user_id: string;
          created_at: string;
          updated_at: string;
          entry_subtype_code: string | null;
        };
        Insert: {
          id?: string;
          church_id: string;
          member_id?: string | null;
          department_id?: string | null;
          fund_id: string;
          inflow_type: string;
          amount: number;
          inflow_date: string;
          is_anonymous?: boolean;
          note?: string | null;
          reference_number?: string | null;
          recorded_by_user_id: string;
          created_at?: string;
          updated_at?: string;
          entry_subtype_code?: string | null;
        };
        Update: {
          id?: string;
          church_id?: string;
          member_id?: string | null;
          department_id?: string | null;
          fund_id?: string;
          inflow_type?: string;
          amount?: number;
          inflow_date?: string;
          is_anonymous?: boolean;
          note?: string | null;
          reference_number?: string | null;
          recorded_by_user_id?: string;
          created_at?: string;
          updated_at?: string;
          entry_subtype_code?: string | null;
        };
      };
      treasury_outflows: {
        Row: {
          id: string;
          church_id: string;
          fund_id: string | null;
          department_id: string | null;
          outflow_type: string;
          amount: number;
          outflow_date: string;
          payee: string | null;
          purpose: string;
          project_name: string | null;
          reference_number: string | null;
          note: string | null;
          recorded_by_user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          fund_id?: string | null;
          department_id?: string | null;
          outflow_type: string;
          amount: number;
          outflow_date: string;
          payee?: string | null;
          purpose: string;
          project_name?: string | null;
          reference_number?: string | null;
          note?: string | null;
          recorded_by_user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          fund_id?: string | null;
          department_id?: string | null;
          outflow_type?: string;
          amount?: number;
          outflow_date?: string;
          payee?: string | null;
          purpose?: string;
          project_name?: string | null;
          reference_number?: string | null;
          note?: string | null;
          recorded_by_user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      treasury_fund_transfers: {
        Row: {
          id: string;
          church_id: string;
          source_fund_id: string;
          destination_fund_id: string;
          amount: number;
          transfer_date: string;
          reason: string;
          reference_number: string | null;
          note: string | null;
          recorded_by_user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          source_fund_id: string;
          destination_fund_id: string;
          amount: number;
          transfer_date: string;
          reason: string;
          reference_number?: string | null;
          note?: string | null;
          recorded_by_user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          source_fund_id?: string;
          destination_fund_id?: string;
          amount?: number;
          transfer_date?: string;
          reason?: string;
          reference_number?: string | null;
          note?: string | null;
          recorded_by_user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      treasury_allocation_rules: {
        Row: {
          id: string;
          church_id: string;
          source_inflow_type: string;
          allocation_kind: string;
          target_fund_id: string;
          percentage: number;
          is_active: boolean;
          sort_order: number;
          effective_from: string | null;
          effective_to: string | null;
          created_by_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          source_inflow_type: string;
          allocation_kind: string;
          target_fund_id: string;
          percentage: number;
          is_active?: boolean;
          sort_order?: number;
          effective_from?: string | null;
          effective_to?: string | null;
          created_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          source_inflow_type?: string;
          allocation_kind?: string;
          target_fund_id?: string;
          percentage?: number;
          is_active?: boolean;
          sort_order?: number;
          effective_from?: string | null;
          effective_to?: string | null;
          created_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      treasury_inflow_allocations: {
        Row: {
          id: string;
          church_id: string;
          source_inflow_id: string;
          rule_id: string | null;
          target_fund_id: string;
          allocation_kind: string;
          amount: number;
          status: string;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          source_inflow_id: string;
          rule_id?: string | null;
          target_fund_id: string;
          allocation_kind: string;
          amount: number;
          status?: string;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          source_inflow_id?: string;
          rule_id?: string | null;
          target_fund_id?: string;
          allocation_kind?: string;
          amount?: number;
          status?: string;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      treasury_finance_settings: {
        Row: {
          church_id: string;
          tithe_auto_allocate: boolean;
          offering_auto_allocate: boolean;
          require_reference_numbers: boolean;
          require_member_for_named_inflows: boolean;
          allow_tithe_outflow_only_for_remittance: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          church_id: string;
          tithe_auto_allocate?: boolean;
          offering_auto_allocate?: boolean;
          require_reference_numbers?: boolean;
          require_member_for_named_inflows?: boolean;
          allow_tithe_outflow_only_for_remittance?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          church_id?: string;
          tithe_auto_allocate?: boolean;
          offering_auto_allocate?: boolean;
          require_reference_numbers?: boolean;
          require_member_for_named_inflows?: boolean;
          allow_tithe_outflow_only_for_remittance?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      treasury_remittance_settings: {
        Row: {
          id: string;
          church_id: string;
          is_enabled: boolean;
          is_live: boolean;
          tithe_enabled: boolean;
          tithe_percentage: number;
          offering_enabled: boolean;
          offering_percentage: number;
          source_type: string;
          percentage: number;
          fixed_amount: number | null;
          destination: string;
          frequency: string;
          mode: string;
          allow_override: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          is_enabled?: boolean;
          is_live?: boolean;
          tithe_enabled?: boolean;
          tithe_percentage?: number;
          offering_enabled?: boolean;
          offering_percentage?: number;
          source_type?: string;
          percentage?: number;
          fixed_amount?: number | null;
          destination?: string;
          frequency?: string;
          mode?: string;
          allow_override?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          is_enabled?: boolean;
          is_live?: boolean;
          tithe_enabled?: boolean;
          tithe_percentage?: number;
          offering_enabled?: boolean;
          offering_percentage?: number;
          source_type?: string;
          percentage?: number;
          fixed_amount?: number | null;
          destination?: string;
          frequency?: string;
          mode?: string;
          allow_override?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      treasury_remittance_logs: {
        Row: {
          id: string;
          church_id: string;
          run_date: string;
          source_type: string;
          source_amount: number;
          remitted_amount: number;
          destination: string;
          frequency: string;
          mode: string;
          status: string;
          outflow_reference: string | null;
          note: string | null;
          recorded_by_user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          run_date: string;
          source_type: string;
          source_amount: number;
          remitted_amount: number;
          destination: string;
          frequency: string;
          mode: string;
          status: string;
          outflow_reference?: string | null;
          note?: string | null;
          recorded_by_user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          run_date?: string;
          source_type?: string;
          source_amount?: number;
          remitted_amount?: number;
          destination?: string;
          frequency?: string;
          mode?: string;
          status?: string;
          outflow_reference?: string | null;
          note?: string | null;
          recorded_by_user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      treasury_audit_logs: {
        Row: {
          id: string;
          church_id: string;
          entity_type: string;
          entity_id: string;
          action_type: string;
          changed_by_user_id: string | null;
          correction_note: string | null;
          before_snapshot: Json | null;
          after_snapshot: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          entity_type: string;
          entity_id: string;
          action_type: string;
          changed_by_user_id?: string | null;
          correction_note?: string | null;
          before_snapshot?: Json | null;
          after_snapshot?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          entity_type?: string;
          entity_id?: string;
          action_type?: string;
          changed_by_user_id?: string | null;
          correction_note?: string | null;
          before_snapshot?: Json | null;
          after_snapshot?: Json | null;
          created_at?: string;
        };
      };
      // Approvals
      approval_policies: {
        Row: {
          id: string;
          church_id: string;
          module_key: string;
          request_type: string;
          requires_office_review: boolean;
          requires_leadership_review: boolean;
          requires_treasury_review: boolean;
          final_approver_role_code: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          module_key: string;
          request_type: string;
          requires_office_review?: boolean;
          requires_leadership_review?: boolean;
          requires_treasury_review?: boolean;
          final_approver_role_code?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          module_key?: string;
          request_type?: string;
          requires_office_review?: boolean;
          requires_leadership_review?: boolean;
          requires_treasury_review?: boolean;
          final_approver_role_code?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      approval_requests: {
        Row: {
          id: string;
          church_id: string;
          module_key: string;
          entity_type: string;
          entity_id: string;
          request_type: string;
          submitted_by_user_id: string | null;
          current_stage: string;
          status: string;
          priority: string;
          current_assignee_role_code: string | null;
          payload: Json;
          submitted_at: string;
          decided_at: string | null;
          decided_by_user_id: string | null;
          decision_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          module_key: string;
          entity_type: string;
          entity_id: string;
          request_type: string;
          submitted_by_user_id?: string | null;
          current_stage?: string;
          status?: string;
          priority?: string;
          current_assignee_role_code?: string | null;
          payload?: Json;
          submitted_at?: string;
          decided_at?: string | null;
          decided_by_user_id?: string | null;
          decision_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          module_key?: string;
          entity_type?: string;
          entity_id?: string;
          request_type?: string;
          submitted_by_user_id?: string | null;
          current_stage?: string;
          status?: string;
          priority?: string;
          current_assignee_role_code?: string | null;
          payload?: Json;
          submitted_at?: string;
          decided_at?: string | null;
          decided_by_user_id?: string | null;
          decision_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      approval_steps: {
        Row: {
          id: string;
          approval_request_id: string;
          church_id: string;
          stage_key: string;
          approver_role_code: string | null;
          approver_user_id: string | null;
          decision: string | null;
          decision_note: string | null;
          acted_at: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          approval_request_id: string;
          church_id: string;
          stage_key: string;
          approver_role_code?: string | null;
          approver_user_id?: string | null;
          decision?: string | null;
          decision_note?: string | null;
          acted_at?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          approval_request_id?: string;
          church_id?: string;
          stage_key?: string;
          approver_role_code?: string | null;
          approver_user_id?: string | null;
          decision?: string | null;
          decision_note?: string | null;
          acted_at?: string | null;
          sort_order?: number;
          created_at?: string;
        };
      };
      approval_audit_logs: {
        Row: {
          id: string;
          church_id: string;
          approval_request_id: string;
          action_type: string;
          actor_user_id: string | null;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          approval_request_id: string;
          action_type: string;
          actor_user_id?: string | null;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          approval_request_id?: string;
          action_type?: string;
          actor_user_id?: string | null;
          payload?: Json;
          created_at?: string;
        };
      };
      church_member_registration_settings: {
        Row: {
          church_id: string;
          is_enabled: boolean;
          registration_key_hash: string | null;
          require_admin_review: boolean;
          auto_create_as_visitor: boolean;
          collect_date_of_birth: boolean;
          collect_emergency_contact: boolean;
          collect_household_information: boolean;
          collect_department_interests: boolean;
          welcome_message: string | null;
          success_message: string | null;
          created_by_user_id: string | null;
          updated_by_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          church_id: string;
          is_enabled?: boolean;
          registration_key_hash?: string | null;
          require_admin_review?: boolean;
          auto_create_as_visitor?: boolean;
          collect_date_of_birth?: boolean;
          collect_emergency_contact?: boolean;
          collect_household_information?: boolean;
          collect_department_interests?: boolean;
          welcome_message?: string | null;
          success_message?: string | null;
          created_by_user_id?: string | null;
          updated_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          church_id?: string;
          is_enabled?: boolean;
          registration_key_hash?: string | null;
          require_admin_review?: boolean;
          auto_create_as_visitor?: boolean;
          collect_date_of_birth?: boolean;
          collect_emergency_contact?: boolean;
          collect_household_information?: boolean;
          collect_department_interests?: boolean;
          welcome_message?: string | null;
          success_message?: string | null;
          created_by_user_id?: string | null;
          updated_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      church_member_registrations: {
        Row: {
          id: string;
          church_id: string;
          first_name: string;
          last_name: string;
          display_name: string | null;
          email: string | null;
          phone: string | null;
          date_of_birth: string | null;
          gender: string | null;
          marital_status: string | null;
          profession: string | null;
          address: string | null;
          city: string | null;
          country: string | null;
          preferred_contact_method: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          how_heard_about_church: string | null;
          christian_status: string | null;
          is_baptized: boolean | null;
          baptism_date: string | null;
          previous_church: string | null;
          wants_membership: boolean | null;
          requested_membership_type: string | null;
          transfer_in_date: string | null;
          household_action: string;
          suggested_household_name: string | null;
          suggested_household_head_name: string | null;
          suggested_household_head_phone: string | null;
          suggested_household_role: string | null;
          suggested_household_address: string | null;
          suggested_household_city: string | null;
          suggested_household_country: string | null;
          suggested_household_phone: string | null;
          suggested_household_email: string | null;
          household_notes: string | null;
          department_interest_ids: Json;
          notes: string | null;
          privacy_consent: boolean;
          status: string;
          possible_duplicate_member_id: string | null;
          possible_duplicate_household_id: string | null;
          matched_member_id: string | null;
          matched_household_id: string | null;
          created_member_id: string | null;
          created_household_id: string | null;
          reviewed_by_user_id: string | null;
          reviewed_at: string | null;
          review_note: string | null;
          submitted_at: string;
          created_at: string;
          updated_at: string;
          metadata: Json;
          auth_user_id: string | null;
          login_email: string | null;
          account_setup_requested: boolean;
          account_setup_status: string;
          account_setup_verified_at: string | null;
        };
        Insert: {
          id?: string;
          church_id: string;
          first_name: string;
          last_name: string;
          display_name?: string | null;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          marital_status?: string | null;
          profession?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          preferred_contact_method?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          how_heard_about_church?: string | null;
          christian_status?: string | null;
          is_baptized?: boolean | null;
          baptism_date?: string | null;
          previous_church?: string | null;
          wants_membership?: boolean | null;
          requested_membership_type?: string | null;
          transfer_in_date?: string | null;
          household_action?: string;
          suggested_household_name?: string | null;
          suggested_household_head_name?: string | null;
          suggested_household_head_phone?: string | null;
          suggested_household_role?: string | null;
          suggested_household_address?: string | null;
          suggested_household_city?: string | null;
          suggested_household_country?: string | null;
          suggested_household_phone?: string | null;
          suggested_household_email?: string | null;
          household_notes?: string | null;
          department_interest_ids?: Json;
          notes?: string | null;
          privacy_consent?: boolean;
          status?: string;
          possible_duplicate_member_id?: string | null;
          possible_duplicate_household_id?: string | null;
          matched_member_id?: string | null;
          matched_household_id?: string | null;
          created_member_id?: string | null;
          created_household_id?: string | null;
          reviewed_by_user_id?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
          submitted_at?: string;
          created_at?: string;
          updated_at?: string;
          metadata?: Json;
          auth_user_id?: string | null;
          login_email?: string | null;
          account_setup_requested?: boolean;
          account_setup_status?: string;
          account_setup_verified_at?: string | null;
        };
        Update: {
          id?: string;
          church_id?: string;
          first_name?: string;
          last_name?: string;
          display_name?: string | null;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          marital_status?: string | null;
          profession?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          preferred_contact_method?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          how_heard_about_church?: string | null;
          christian_status?: string | null;
          is_baptized?: boolean | null;
          baptism_date?: string | null;
          previous_church?: string | null;
          wants_membership?: boolean | null;
          requested_membership_type?: string | null;
          transfer_in_date?: string | null;
          household_action?: string;
          suggested_household_name?: string | null;
          suggested_household_head_name?: string | null;
          suggested_household_head_phone?: string | null;
          suggested_household_role?: string | null;
          suggested_household_address?: string | null;
          suggested_household_city?: string | null;
          suggested_household_country?: string | null;
          suggested_household_phone?: string | null;
          suggested_household_email?: string | null;
          household_notes?: string | null;
          department_interest_ids?: Json;
          notes?: string | null;
          privacy_consent?: boolean;
          status?: string;
          possible_duplicate_member_id?: string | null;
          possible_duplicate_household_id?: string | null;
          matched_member_id?: string | null;
          matched_household_id?: string | null;
          created_member_id?: string | null;
          created_household_id?: string | null;
          reviewed_by_user_id?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
          submitted_at?: string;
          created_at?: string;
          updated_at?: string;
          metadata?: Json;
          auth_user_id?: string | null;
          login_email?: string | null;
          account_setup_requested?: boolean;
          account_setup_status?: string;
          account_setup_verified_at?: string | null;
        };
      };
      church_member_registration_household_members: {
        Row: {
          id: string;
          registration_id: string;
          church_id: string;
          first_name: string;
          last_name: string;
          relationship: string;
          date_of_birth: string | null;
          gender: string | null;
          email: string | null;
          phone: string | null;
          membership_status_suggestion: string | null;
          status: string;
          possible_member_match_id: string | null;
          matched_member_id: string | null;
          resulting_member_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          registration_id: string;
          church_id: string;
          first_name: string;
          last_name: string;
          relationship: string;
          date_of_birth?: string | null;
          gender?: string | null;
          email?: string | null;
          phone?: string | null;
          membership_status_suggestion?: string | null;
          status?: string;
          possible_member_match_id?: string | null;
          matched_member_id?: string | null;
          resulting_member_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          registration_id?: string;
          church_id?: string;
          first_name?: string;
          last_name?: string;
          relationship?: string;
          date_of_birth?: string | null;
          gender?: string | null;
          email?: string | null;
          phone?: string | null;
          membership_status_suggestion?: string | null;
          status?: string;
          possible_member_match_id?: string | null;
          matched_member_id?: string | null;
          resulting_member_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Church = Tables<"churches">;
export type Profile = Tables<"profiles">;
export type ChurchUser = Tables<"church_users">;
export type RoleDefinition = Tables<"role_definitions">;
export type ChurchRoleAssignment = Tables<"church_role_assignments">;
export type ChurchDepartment = Tables<"church_departments">;
export type Member = Tables<"members">;
export type MemberDepartment = Tables<"member_departments">;
export type MemberStatusHistory = Tables<"member_status_history">;
export type Household = Tables<"households">;

// Member registration types
export type ChurchMemberRegistrationSettings = Tables<"church_member_registration_settings">;
export type ChurchMemberRegistration = Tables<"church_member_registrations">;
export type ChurchMemberRegistrationHouseholdMember = Tables<"church_member_registration_household_members">;

// Commerce types
export type Product = Tables<"products">;
export type Offer = Tables<"offers">;
export type OfferProduct = Tables<"offer_products">;
export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type Payment = Tables<"payments">;
export type PrintingRequest = Tables<"printing_requests">;

// Permission and Access Control types
export type PermissionDefinition = Tables<"permission_definitions">;
export type ChurchPermissionAssignment = Tables<"church_permission_assignments">;
export type AccessControlAuditLog = Tables<"access_control_audit_logs">;
export type ChurchAccessRequest = Tables<"church_access_requests">;

// Event types
export type ChurchEvent = Tables<"church_events">;
export type ChurchEventDepartment = Tables<"church_event_departments">;

// Announcement types
export type ChurchAnnouncement = Tables<"church_announcements">;

// Treasury types
export type TreasuryFund = Tables<"treasury_funds">;
export type TreasuryInflow = Tables<"treasury_inflows">;
export type TreasuryOutflow = Tables<"treasury_outflows">;
export type TreasuryFundTransfer = Tables<"treasury_fund_transfers">;
export type TreasuryAllocationRule = Tables<"treasury_allocation_rules">;
export type TreasuryInflowAllocation = Tables<"treasury_inflow_allocations">;
export type TreasuryFinanceSettings = Tables<"treasury_finance_settings">;
export type TreasuryRemittanceSettings = Tables<"treasury_remittance_settings">;
export type TreasuryRemittanceLog = Tables<"treasury_remittance_logs">;
export type TreasuryAuditLog = Tables<"treasury_audit_logs">;
export type DepartmentFundRequest = Tables<"department_fund_requests">;

// Approval types
export type ApprovalPolicy = Tables<"approval_policies">;
export type ApprovalRequest = Tables<"approval_requests">;
export type ApprovalStep = Tables<"approval_steps">;
export type ApprovalAuditLog = Tables<"approval_audit_logs">;

// Payment method enum (matches live DB)
export type PaymentMethod = "cash" | "gcash" | "credit";

// Order status enum
export type OrderStatus = "pending" | "confirmed" | "cancelled" | "completed";

// Payment status enum  
export type PaymentStatus = "pending" | "verified" | "rejected" | "refunded";
