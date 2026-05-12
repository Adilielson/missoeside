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
      donations: {
        Row: {
          amount: number
          asaas_customer: string | null
          asaas_id: string | null
          asaas_link: string | null
          boleto_url: string | null
          campaign: string | null
          created_at: string
          donor_cpf: string | null
          donor_email: string
          donor_name: string
          donor_phone: string | null
          email_sent: boolean | null
          id: string
          is_anonymous: boolean | null
          notified_at: string | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          pix_payload: string | null
          pix_qrcode: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["donation_status"]
          type: Database["public"]["Enums"]["donation_type"]
          updated_at: string
          whatsapp_sent: boolean | null
        }
        Insert: {
          amount: number
          asaas_customer?: string | null
          asaas_id?: string | null
          asaas_link?: string | null
          boleto_url?: string | null
          campaign?: string | null
          created_at?: string
          donor_cpf?: string | null
          donor_email: string
          donor_name: string
          donor_phone?: string | null
          email_sent?: boolean | null
          id?: string
          is_anonymous?: boolean | null
          notified_at?: string | null
          paid_at?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          pix_payload?: string | null
          pix_qrcode?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["donation_status"]
          type?: Database["public"]["Enums"]["donation_type"]
          updated_at?: string
          whatsapp_sent?: boolean | null
        }
        Update: {
          amount?: number
          asaas_customer?: string | null
          asaas_id?: string | null
          asaas_link?: string | null
          boleto_url?: string | null
          campaign?: string | null
          created_at?: string
          donor_cpf?: string | null
          donor_email?: string
          donor_name?: string
          donor_phone?: string | null
          email_sent?: boolean | null
          id?: string
          is_anonymous?: boolean | null
          notified_at?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          pix_payload?: string | null
          pix_qrcode?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["donation_status"]
          type?: Database["public"]["Enums"]["donation_type"]
          updated_at?: string
          whatsapp_sent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          author_id: string | null
          city: string | null
          cover_image: string | null
          created_at: string
          description: string | null
          end_date: string | null
          event_date: string
          id: string
          location: string | null
          max_attendees: number | null
          registration_url: string | null
          slug: string
          state: string | null
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          city?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date: string
          id?: string
          location?: string | null
          max_attendees?: number | null
          registration_url?: string | null
          slug: string
          state?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          city?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date?: string
          id?: string
          location?: string | null
          max_attendees?: number | null
          registration_url?: string | null
          slug?: string
          state?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          donation_id: string
          error_msg: string | null
          id: string
          provider_id: string | null
          recipient: string
          sent_at: string
          status: Database["public"]["Enums"]["notification_status"]
        }
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"]
          donation_id: string
          error_msg?: string | null
          id?: string
          provider_id?: string | null
          recipient: string
          sent_at?: string
          status?: Database["public"]["Enums"]["notification_status"]
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          donation_id?: string
          error_msg?: string | null
          id?: string
          provider_id?: string | null
          recipient?: string
          sent_at?: string
          status?: Database["public"]["Enums"]["notification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          category: string | null
          content: string | null
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["post_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["post_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["post_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          permissions: string[] | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          permissions?: string[] | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          permissions?: string[] | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          category: string | null
          city: string | null
          country: string | null
          cover_image: string | null
          created_at: string
          current_amount: number | null
          description: string | null
          email_subject: string | null
          email_template: string | null
          featured: boolean | null
          gallery: string[] | null
          goal_amount: number | null
          id: string
          name: string
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          category?: string | null
          city?: string | null
          country?: string | null
          cover_image?: string | null
          created_at?: string
          current_amount?: number | null
          description?: string | null
          email_subject?: string | null
          email_template?: string | null
          featured?: boolean | null
          gallery?: string[] | null
          goal_amount?: number | null
          id?: string
          name: string
          short_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          category?: string | null
          city?: string | null
          country?: string | null
          cover_image?: string | null
          created_at?: string
          current_amount?: number | null
          description?: string | null
          email_subject?: string | null
          email_template?: string | null
          featured?: boolean | null
          gallery?: string[] | null
          goal_amount?: number | null
          id?: string
          name?: string
          short_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          id: string
          key: string
          section: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          section: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          section?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "site_content_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          area: string
          created_at: string
          display_order: number
          featured: boolean
          full_bio: string | null
          id: string
          image_url: string | null
          instagram_url: string | null
          linkedin_url: string | null
          name: string
          role: string
          short_bio: string | null
          slug: string
          specialties: string[]
          status: string
          updated_at: string
        }
        Insert: {
          area: string
          created_at?: string
          display_order?: number
          featured?: boolean
          full_bio?: string | null
          id?: string
          image_url?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          name: string
          role: string
          short_bio?: string | null
          slug: string
          specialties?: string[]
          status?: string
          updated_at?: string
        }
        Update: {
          area?: string
          created_at?: string
          display_order?: number
          featured?: boolean
          full_bio?: string | null
          id?: string
          image_url?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          name?: string
          role?: string
          short_bio?: string | null
          slug?: string
          specialties?: string[]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      donation_status:
        | "PENDING"
        | "CONFIRMED"
        | "RECEIVED"
        | "CANCELLED"
        | "REFUNDED"
      donation_type: "ONE_TIME" | "MONTHLY"
      event_status: "DRAFT" | "PUBLISHED" | "CANCELLED"
      notification_channel: "EMAIL" | "WHATSAPP"
      notification_status: "SENT" | "FAILED" | "PENDING"
      payment_method: "PIX" | "CREDIT_CARD" | "BOLETO"
      post_status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
      project_status: "DRAFT" | "PUBLISHED"
      user_role: "admin" | "editor"
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
      donation_status: [
        "PENDING",
        "CONFIRMED",
        "RECEIVED",
        "CANCELLED",
        "REFUNDED",
      ],
      donation_type: ["ONE_TIME", "MONTHLY"],
      event_status: ["DRAFT", "PUBLISHED", "CANCELLED"],
      notification_channel: ["EMAIL", "WHATSAPP"],
      notification_status: ["SENT", "FAILED", "PENDING"],
      payment_method: ["PIX", "CREDIT_CARD", "BOLETO"],
      post_status: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      project_status: ["DRAFT", "PUBLISHED"],
      user_role: ["admin", "editor"],
    },
  },
} as const
