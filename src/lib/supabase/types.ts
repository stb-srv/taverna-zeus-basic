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
      additives: {
        Row: {
          code: string
          id: string
          name_de: string
          name_en: string
          name_i18n: Json
        }
        Insert: {
          code: string
          id?: string
          name_de: string
          name_en: string
          name_i18n?: Json
        }
        Update: {
          code?: string
          id?: string
          name_de?: string
          name_en?: string
          name_i18n?: Json
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      allergens: {
        Row: {
          code: string
          id: string
          name_de: string
          name_en: string
          name_i18n: Json
        }
        Insert: {
          code: string
          id?: string
          name_de: string
          name_en: string
          name_i18n?: Json
        }
        Update: {
          code?: string
          id?: string
          name_de?: string
          name_en?: string
          name_i18n?: Json
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: number
          locale: string | null
          message: string
          name: string
          phone: string | null
          read_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: never
          locale?: string | null
          message: string
          name: string
          phone?: string | null
          read_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: never
          locale?: string | null
          message?: string
          name?: string
          phone?: string | null
          read_at?: string | null
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          alt_de: string | null
          alt_en: string | null
          alt_i18n: Json
          context_key: string
          created_at: string
          id: string
          image_url: string
          sort_order: number
        }
        Insert: {
          alt_de?: string | null
          alt_en?: string | null
          alt_i18n?: Json
          context_key: string
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number
        }
        Update: {
          alt_de?: string | null
          alt_en?: string | null
          alt_i18n?: Json
          context_key?: string
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number
        }
        Relationships: []
      }
      kitchen_hours: {
        Row: {
          close_time: string | null
          day_of_week: number
          id: string
          is_closed: boolean
          open_time: string | null
          sort_order: number
        }
        Insert: {
          close_time?: string | null
          day_of_week: number
          id?: string
          is_closed?: boolean
          open_time?: string | null
          sort_order?: number
        }
        Update: {
          close_time?: string | null
          day_of_week?: number
          id?: string
          is_closed?: boolean
          open_time?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          is_active: boolean
          is_default: boolean
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          is_active?: boolean
          is_default?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          created_at: string
          description_de: string | null
          description_en: string | null
          description_i18n: Json
          id: string
          is_active: boolean
          name_de: string
          name_en: string
          name_i18n: Json
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          description_i18n?: Json
          id?: string
          is_active?: boolean
          name_de: string
          name_en: string
          name_i18n?: Json
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          description_i18n?: Json
          id?: string
          is_active?: boolean
          name_de?: string
          name_en?: string
          name_i18n?: Json
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_additives: {
        Row: {
          additive_id: string
          item_id: string
        }
        Insert: {
          additive_id: string
          item_id: string
        }
        Update: {
          additive_id?: string
          item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_additives_additive_id_fkey"
            columns: ["additive_id"]
            isOneToOne: false
            referencedRelation: "additives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_additives_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_allergens: {
        Row: {
          allergen_id: string
          item_id: string
        }
        Insert: {
          allergen_id: string
          item_id: string
        }
        Update: {
          allergen_id?: string
          item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_allergens_allergen_id_fkey"
            columns: ["allergen_id"]
            isOneToOne: false
            referencedRelation: "allergens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_allergens_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category_id: string
          created_at: string
          description_de: string | null
          description_en: string | null
          description_i18n: Json
          id: string
          image_url: string | null
          is_active: boolean
          item_number: string | null
          name_de: string
          name_en: string
          name_i18n: Json
          price: number | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          description_i18n?: Json
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_number?: string | null
          name_de: string
          name_en: string
          name_i18n?: Json
          price?: number | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          description_i18n?: Json
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_number?: string | null
          name_de?: string
          name_en?: string
          name_i18n?: Json
          price?: number | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      opening_hours: {
        Row: {
          close_time: string | null
          day_of_week: number
          id: string
          is_closed: boolean
          open_time: string | null
          sort_order: number
        }
        Insert: {
          close_time?: string | null
          day_of_week: number
          id?: string
          is_closed?: boolean
          open_time?: string | null
          sort_order?: number
        }
        Update: {
          close_time?: string | null
          day_of_week?: number
          id?: string
          is_closed?: boolean
          open_time?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      pages: {
        Row: {
          content_de: string | null
          content_en: string | null
          content_i18n: Json
          created_at: string
          id: string
          is_published: boolean
          show_in_nav: boolean
          slug: string
          sort_order: number
          title_de: string
          title_en: string
          title_i18n: Json
          updated_at: string
        }
        Insert: {
          content_de?: string | null
          content_en?: string | null
          content_i18n?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          show_in_nav?: boolean
          slug: string
          sort_order?: number
          title_de: string
          title_en: string
          title_i18n?: Json
          updated_at?: string
        }
        Update: {
          content_de?: string | null
          content_en?: string | null
          content_i18n?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          show_in_nav?: boolean
          slug?: string
          sort_order?: number
          title_de?: string
          title_en?: string
          title_i18n?: Json
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_settings: {
        Row: {
          address_city: string | null
          address_country: string | null
          address_street: string | null
          address_zip: string | null
          closure_banner_enabled: boolean
          closure_banner_from: string | null
          closure_banner_message_de: string | null
          closure_banner_message_en: string | null
          closure_banner_message_i18n: Json
          closure_banner_until: string | null
          created_at: string
          description_de: string | null
          description_en: string | null
          description_i18n: Json
          email: string | null
          enabled_locales: Json
          google_maps_embed: string | null
          hero_image_url: string | null
          id: number
          kitchen_hours_enabled: boolean
          name: string
          phone: string | null
          social_links: Json
          ui_messages: Json
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_country?: string | null
          address_street?: string | null
          address_zip?: string | null
          closure_banner_enabled?: boolean
          closure_banner_from?: string | null
          closure_banner_message_de?: string | null
          closure_banner_message_en?: string | null
          closure_banner_message_i18n?: Json
          closure_banner_until?: string | null
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          description_i18n?: Json
          email?: string | null
          enabled_locales?: Json
          google_maps_embed?: string | null
          hero_image_url?: string | null
          id?: number
          kitchen_hours_enabled?: boolean
          name?: string
          phone?: string | null
          social_links?: Json
          ui_messages?: Json
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_country?: string | null
          address_street?: string | null
          address_zip?: string | null
          closure_banner_enabled?: boolean
          closure_banner_from?: string | null
          closure_banner_message_de?: string | null
          closure_banner_message_en?: string | null
          closure_banner_message_i18n?: Json
          closure_banner_until?: string | null
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          description_i18n?: Json
          email?: string | null
          enabled_locales?: Json
          google_maps_embed?: string | null
          hero_image_url?: string | null
          id?: number
          kitchen_hours_enabled?: boolean
          name?: string
          phone?: string | null
          social_links?: Json
          ui_messages?: Json
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_name: string
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_published: boolean
          last_name: string | null
          rating: number
          review_date: string | null
          review_text_de: string | null
          review_text_en: string | null
          review_text_i18n: Json
          sort_order: number
          source: string
        }
        Insert: {
          author_name: string
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_published?: boolean
          last_name?: string | null
          rating: number
          review_date?: string | null
          review_text_de?: string | null
          review_text_en?: string | null
          review_text_i18n?: Json
          sort_order?: number
          source?: string
        }
        Update: {
          author_name?: string
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_published?: boolean
          last_name?: string | null
          rating?: number
          review_date?: string | null
          review_text_de?: string | null
          review_text_en?: string | null
          review_text_i18n?: Json
          sort_order?: number
          source?: string
        }
        Relationships: []
      }
      smtp_settings: {
        Row: {
          from_address: string | null
          host: string | null
          id: number
          notify_email: string | null
          password: string | null
          port: number | null
          updated_at: string
          username: string | null
        }
        Insert: {
          from_address?: string | null
          host?: string | null
          id?: number
          notify_email?: string | null
          password?: string | null
          port?: number | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          from_address?: string | null
          host?: string | null
          id?: number
          notify_email?: string | null
          password?: string | null
          port?: number | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      spam_blocks: {
        Row: {
          created_at: string
          id: number
          ip: string | null
          locale: string | null
          reason: string
        }
        Insert: {
          created_at?: string
          id?: never
          ip?: string | null
          locale?: string | null
          reason: string
        }
        Update: {
          created_at?: string
          id?: never
          ip?: string | null
          locale?: string | null
          reason?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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
