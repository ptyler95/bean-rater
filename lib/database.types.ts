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
      bag_flags: {
        Row: {
          bag_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          bag_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          bag_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bag_flags_bag_id_fkey"
            columns: ["bag_id"]
            isOneToOne: false
            referencedRelation: "bags"
            referencedColumns: ["id"]
          },
        ]
      }
      bags: {
        Row: {
          added_by: string
          altitude_masl: number | null
          bag_size: string | null
          brand_id: string
          coffee_name: string
          created_at: string
          flag_count: number
          flagged: boolean
          id: string
          origin: string
          photo_url: string | null
          process: Database["public"]["Enums"]["process_method"]
          product_url: string | null
          region: string | null
          roast_level: Database["public"]["Enums"]["roast_level"]
          updated_at: string
          varietal: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          added_by: string
          altitude_masl?: number | null
          bag_size?: string | null
          brand_id: string
          coffee_name: string
          created_at?: string
          flag_count?: number
          flagged?: boolean
          id?: string
          origin: string
          photo_url?: string | null
          process: Database["public"]["Enums"]["process_method"]
          product_url?: string | null
          region?: string | null
          roast_level: Database["public"]["Enums"]["roast_level"]
          updated_at?: string
          varietal?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          added_by?: string
          altitude_masl?: number | null
          bag_size?: string | null
          brand_id?: string
          coffee_name?: string
          created_at?: string
          flag_count?: number
          flagged?: boolean
          id?: string
          origin?: string
          photo_url?: string | null
          process?: Database["public"]["Enums"]["process_method"]
          product_url?: string | null
          region?: string | null
          roast_level?: Database["public"]["Enums"]["roast_level"]
          updated_at?: string
          varietal?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "bags_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          claimed: boolean
          claimed_by: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          claimed?: boolean
          claimed_by?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          claimed?: boolean
          claimed_by?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          recipe_count: number
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          recipe_count?: number
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          recipe_count?: number
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          bag_id: string
          brew_method: Database["public"]["Enums"]["brew_method"]
          brew_time_s: number
          burr_type: string | null
          created_at: string
          dose_g: number
          freshness_offset:
            | Database["public"]["Enums"]["freshness_offset"]
            | null
          grind_category: Database["public"]["Enums"]["grind_category"]
          grinder_model: string | null
          id: string
          machine_model: string | null
          notes: string | null
          rating: number
          updated_at: string
          user_id: string
          water_ml: number | null
          water_temp_c: number
          yield_g: number | null
        }
        Insert: {
          bag_id: string
          brew_method: Database["public"]["Enums"]["brew_method"]
          brew_time_s: number
          burr_type?: string | null
          created_at?: string
          dose_g: number
          freshness_offset?:
            | Database["public"]["Enums"]["freshness_offset"]
            | null
          grind_category: Database["public"]["Enums"]["grind_category"]
          grinder_model?: string | null
          id?: string
          machine_model?: string | null
          notes?: string | null
          rating: number
          updated_at?: string
          user_id: string
          water_ml?: number | null
          water_temp_c: number
          yield_g?: number | null
        }
        Update: {
          bag_id?: string
          brew_method?: Database["public"]["Enums"]["brew_method"]
          brew_time_s?: number
          burr_type?: string | null
          created_at?: string
          dose_g?: number
          freshness_offset?:
            | Database["public"]["Enums"]["freshness_offset"]
            | null
          grind_category?: Database["public"]["Enums"]["grind_category"]
          grinder_model?: string | null
          id?: string
          machine_model?: string | null
          notes?: string | null
          rating?: number
          updated_at?: string
          user_id?: string
          water_ml?: number | null
          water_temp_c?: number
          yield_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_bag_id_fkey"
            columns: ["bag_id"]
            isOneToOne: false
            referencedRelation: "bags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_user_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bag_method_consensus: {
        Args: { p_bag_id: string }
        Returns: {
          avg_brew_time_s: number
          avg_dose_g: number
          avg_rating: number
          avg_water_ml: number
          avg_water_temp_c: number
          avg_yield_g: number
          brew_method: Database["public"]["Enums"]["brew_method"]
          modal_grind: Database["public"]["Enums"]["grind_category"]
          recipe_count: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      search_bags: {
        Args: { q: string }
        Returns: {
          bag_id: string
          brand_name: string
          coffee_name: string
          origin: string
          photo_url: string
          process: Database["public"]["Enums"]["process_method"]
          recipe_count: number
          roast_level: Database["public"]["Enums"]["roast_level"]
          sim: number
          verification_status: Database["public"]["Enums"]["verification_status"]
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      brew_method:
        | "espresso"
        | "v60"
        | "aeropress"
        | "french_press"
        | "moka_pot"
        | "cold_brew"
        | "batch"
      freshness_offset: "under_7" | "7_to_14" | "14_to_21" | "over_21"
      grind_category:
        | "extra_fine"
        | "fine"
        | "medium_fine"
        | "medium"
        | "medium_coarse"
        | "coarse"
        | "extra_coarse"
      process_method: "washed" | "natural" | "honey" | "anaerobic" | "other"
      roast_level: "light" | "medium_light" | "medium" | "medium_dark" | "dark"
      user_role: "user" | "admin"
      verification_status:
        | "unverified"
        | "community_verified"
        | "roaster_verified"
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
      brew_method: [
        "espresso",
        "v60",
        "aeropress",
        "french_press",
        "moka_pot",
        "cold_brew",
        "batch",
      ],
      freshness_offset: ["under_7", "7_to_14", "14_to_21", "over_21"],
      grind_category: [
        "extra_fine",
        "fine",
        "medium_fine",
        "medium",
        "medium_coarse",
        "coarse",
        "extra_coarse",
      ],
      process_method: ["washed", "natural", "honey", "anaerobic", "other"],
      roast_level: ["light", "medium_light", "medium", "medium_dark", "dark"],
      user_role: ["user", "admin"],
      verification_status: [
        "unverified",
        "community_verified",
        "roaster_verified",
      ],
    },
  },
} as const
