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

// Commerce types
export type Product = Tables<"products">;
export type Offer = Tables<"offers">;
export type OfferProduct = Tables<"offer_products">;
export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type Payment = Tables<"payments">;
export type PrintingRequest = Tables<"printing_requests">;

// Payment method enum (matches live DB)
export type PaymentMethod = "cash" | "gcash" | "credit";

// Order status enum
export type OrderStatus = "pending" | "confirmed" | "cancelled" | "completed";

// Payment status enum  
export type PaymentStatus = "pending" | "verified" | "rejected" | "refunded";
