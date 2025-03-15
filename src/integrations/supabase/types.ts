export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      advisor_chats: {
        Row: {
          content: string
          id: string
          role: string
          timestamp: string
          user_id: string
        }
        Insert: {
          content: string
          id?: string
          role: string
          timestamp?: string
          user_id: string
        }
        Update: {
          content?: string
          id?: string
          role?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advisor_chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      climate_averages: {
        Row: {
          avg_precipitation: number | null
          avg_temperature: number | null
          avg_uv_index: number | null
          id: string
          last_updated: string | null
          location: string
          month: number
          user_id: string
        }
        Insert: {
          avg_precipitation?: number | null
          avg_temperature?: number | null
          avg_uv_index?: number | null
          id?: string
          last_updated?: string | null
          location: string
          month: number
          user_id: string
        }
        Update: {
          avg_precipitation?: number | null
          avg_temperature?: number | null
          avg_uv_index?: number | null
          id?: string
          last_updated?: string | null
          location?: string
          month?: number
          user_id?: string
        }
        Relationships: []
      }
      garden_images: {
        Row: {
          created_at: string
          day_of_year: number | null
          id: string
          image_path: string
          precipitation: number | null
          season: string | null
          temperature: number | null
          user_id: string
          uv_index: number | null
          weather_condition: string | null
        }
        Insert: {
          created_at?: string
          day_of_year?: number | null
          id?: string
          image_path: string
          precipitation?: number | null
          season?: string | null
          temperature?: number | null
          user_id: string
          uv_index?: number | null
          weather_condition?: string | null
        }
        Update: {
          created_at?: string
          day_of_year?: number | null
          id?: string
          image_path?: string
          precipitation?: number | null
          season?: string | null
          temperature?: number | null
          user_id?: string
          uv_index?: number | null
          weather_condition?: string | null
        }
        Relationships: []
      }
      glossary_terms: {
        Row: {
          created_at: string
          definition: string
          id: string
          term: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          definition: string
          id?: string
          term: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          definition?: string
          id?: string
          term?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      patch_tasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          patch_id: string
          task: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          patch_id: string
          task: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          patch_id?: string
          task?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patch_tasks_patch_id_fkey"
            columns: ["patch_id"]
            isOneToOne: false
            referencedRelation: "patches"
            referencedColumns: ["id"]
          },
        ]
      }
      patches: {
        Row: {
          artificial_light: boolean
          created_at: string
          heated: boolean
          height: number
          id: string
          name: string
          natural_light_percentage: number
          type: string
          updated_at: string
          user_id: string
          width: number
        }
        Insert: {
          artificial_light?: boolean
          created_at?: string
          heated?: boolean
          height: number
          id?: string
          name: string
          natural_light_percentage?: number
          type: string
          updated_at?: string
          user_id: string
          width: number
        }
        Update: {
          artificial_light?: boolean
          created_at?: string
          heated?: boolean
          height?: number
          id?: string
          name?: string
          natural_light_percentage?: number
          type?: string
          updated_at?: string
          user_id?: string
          width?: number
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          language: string
          length_unit: string
          location: string
          temperature_unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string
          length_unit?: string
          location?: string
          temperature_unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          length_unit?: string
          location?: string
          temperature_unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      day_of_year: {
        Args: {
          "": string
        }
        Returns: number
      }
      get_season: {
        Args: {
          "": string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
