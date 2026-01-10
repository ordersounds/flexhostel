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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          building_id: string | null
          content: string
          created_at: string
          created_by: string
          id: string
          image_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          building_id?: string | null
          content: string
          created_at?: string
          created_by: string
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          building_id?: string | null
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          rejection_reason: string | null
          room_id: string
          status: Database["public"]["Enums"]["application_status"]
          submitted_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          rejection_reason?: string | null
          room_id: string
          status?: Database["public"]["Enums"]["application_status"]
          submitted_data: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          rejection_reason?: string | null
          room_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          submitted_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          agent_id: string | null
          building_id: string
          created_at: string
          default_amenities: Json | null
          default_price: number | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          building_id: string
          created_at?: string
          default_amenities?: Json | null
          default_price?: number | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          building_id?: string
          created_at?: string
          default_amenities?: Json | null
          default_price?: number | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          address: string
          agent_id: string | null
          cover_image_url: string | null
          created_at: string
          default_amenities: Json | null
          default_price: number | null
          description: string | null
          gallery_images: Json | null
          id: string
          landlord_id: string | null
          name: string
          slug: string
          status: Database["public"]["Enums"]["building_status"]
          updated_at: string
        }
        Insert: {
          address: string
          agent_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          default_amenities?: Json | null
          default_price?: number | null
          description?: string | null
          gallery_images?: Json | null
          id?: string
          landlord_id?: string | null
          name: string
          slug: string
          status?: Database["public"]["Enums"]["building_status"]
          updated_at?: string
        }
        Update: {
          address?: string
          agent_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          default_amenities?: Json | null
          default_price?: number | null
          description?: string | null
          gallery_images?: Json | null
          id?: string
          landlord_id?: string | null
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["building_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buildings_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      charges: {
        Row: {
          amount: number
          building_id: string
          created_at: string
          frequency: Database["public"]["Enums"]["charge_frequency"]
          id: string
          name: string
          status: Database["public"]["Enums"]["building_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          building_id: string
          created_at?: string
          frequency?: Database["public"]["Enums"]["charge_frequency"]
          id?: string
          name: string
          status?: Database["public"]["Enums"]["building_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          building_id?: string
          created_at?: string
          frequency?: Database["public"]["Enums"]["charge_frequency"]
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["building_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "charges_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          building_id: string | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          receiver_id: string | null
          sender_id: string
        }
        Insert: {
          building_id?: string | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          receiver_id?: string | null
          sender_id: string
        }
        Update: {
          building_id?: string | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          receiver_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          application_id: string | null
          charge_id: string | null
          created_at: string
          currency: string
          id: string
          manual_confirmation_by: string | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          paystack_reference: string
          status: Database["public"]["Enums"]["payment_status"]
          tenancy_id: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          application_id?: string | null
          charge_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          manual_confirmation_by?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          paystack_reference: string
          status?: Database["public"]["Enums"]["payment_status"]
          tenancy_id?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          application_id?: string | null
          charge_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          manual_confirmation_by?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          paystack_reference?: string
          status?: Database["public"]["Enums"]["payment_status"]
          tenancy_id?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_manual_confirmation_by_fkey"
            columns: ["manual_confirmation_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenancy_id_fkey"
            columns: ["tenancy_id"]
            isOneToOne: false
            referencedRelation: "tenancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone_number: string | null
          photo_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_id: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          phone_number?: string | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone_number?: string | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          agent_id: string | null
          amenities: Json | null
          block_id: string | null
          building_id: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          floor_level: string | null
          gallery_images: Json | null
          gender: Database["public"]["Enums"]["room_gender"]
          id: string
          price: number
          room_name: string
          status: Database["public"]["Enums"]["room_status"]
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          amenities?: Json | null
          block_id?: string | null
          building_id: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          floor_level?: string | null
          gallery_images?: Json | null
          gender?: Database["public"]["Enums"]["room_gender"]
          id?: string
          price: number
          room_name: string
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          amenities?: Json | null
          block_id?: string | null
          building_id?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          floor_level?: string | null
          gallery_images?: Json | null
          gender?: Database["public"]["Enums"]["room_gender"]
          id?: string
          price?: number
          room_name?: string
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      tenancies: {
        Row: {
          archived_at: string | null
          created_at: string
          end_date: string
          id: string
          payment_id: string | null
          room_id: string
          start_date: string
          status: Database["public"]["Enums"]["tenancy_status"]
          tenant_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          end_date: string
          id?: string
          payment_id?: string | null
          room_id: string
          start_date: string
          status?: Database["public"]["Enums"]["tenancy_status"]
          tenant_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          end_date?: string
          id?: string
          payment_id?: string | null
          room_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["tenancy_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_payment"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenancies_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenancies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_block_rooms_defaults: {
        Args: {
          block_id_param: string
          new_agent_id_param?: string
          new_amenities_param?: Json
          new_price_param?: number
        }
        Returns: {
          error_message: string
          rooms_updated: number
        }[]
      }
      update_building_rooms_defaults: {
        Args: {
          building_id_param: string
          new_agent_id_param?: string
          new_amenities_param?: Json
          new_price_param?: number
        }
        Returns: {
          error_message: string
          rooms_updated: number
        }[]
      }
    }
    Enums: {
      application_status: "pending" | "approved" | "rejected" | "expired"
      building_status: "active" | "inactive"
      charge_frequency: "monthly" | "yearly"
      payment_status: "pending" | "success" | "failed" | "expired"
      payment_type: "rent" | "charge" | "manual"
      room_gender: "male" | "female" | "any"
      room_status: "available" | "pending" | "occupied"
      tenancy_status: "active" | "archived"
      user_role: "visitor" | "applicant" | "tenant" | "agent" | "landlord"
      user_status: "active" | "suspended" | "archived"
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
      application_status: ["pending", "approved", "rejected", "expired"],
      building_status: ["active", "inactive"],
      charge_frequency: ["monthly", "yearly"],
      payment_status: ["pending", "success", "failed", "expired"],
      payment_type: ["rent", "charge", "manual"],
      room_gender: ["male", "female", "any"],
      room_status: ["available", "pending", "occupied"],
      tenancy_status: ["active", "archived"],
      user_role: ["visitor", "applicant", "tenant", "agent", "landlord"],
      user_status: ["active", "suspended", "archived"],
    },
  },
} as const
