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
      exercise_prs: {
        Row: {
          best_1rm_at: string | null
          best_1rm_kg: number | null
          best_volume_at: string | null
          best_volume_kg: number | null
          best_weight_at: string | null
          best_weight_kg: number | null
          best_weight_reps: number | null
          exercise_key: string
          exercise_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          best_1rm_at?: string | null
          best_1rm_kg?: number | null
          best_volume_at?: string | null
          best_volume_kg?: number | null
          best_weight_at?: string | null
          best_weight_kg?: number | null
          best_weight_reps?: number | null
          exercise_key: string
          exercise_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          best_1rm_at?: string | null
          best_1rm_kg?: number | null
          best_volume_at?: string | null
          best_volume_kg?: number | null
          best_weight_at?: string | null
          best_weight_kg?: number | null
          best_weight_reps?: number | null
          exercise_key?: string
          exercise_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"] | null
          age: number | null
          carbs_g: number | null
          created_at: string
          current_weight_kg: number | null
          daily_calories: number | null
          display_name: string | null
          fat_g: number | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          goal: Database["public"]["Enums"]["goal_type"] | null
          goal_weight_kg: number | null
          health_integration_preference: string | null
          height_cm: number | null
          id: string
          language: string
          maintenance_calories: number | null
          onboarding_completed: boolean
          protein_g: number | null
          updated_at: string
          weekly_change_kg: number | null
          workout_frequency: number | null
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          age?: number | null
          carbs_g?: number | null
          created_at?: string
          current_weight_kg?: number | null
          daily_calories?: number | null
          display_name?: string | null
          fat_g?: number | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          goal?: Database["public"]["Enums"]["goal_type"] | null
          goal_weight_kg?: number | null
          health_integration_preference?: string | null
          height_cm?: number | null
          id: string
          language?: string
          maintenance_calories?: number | null
          onboarding_completed?: boolean
          protein_g?: number | null
          updated_at?: string
          weekly_change_kg?: number | null
          workout_frequency?: number | null
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          age?: number | null
          carbs_g?: number | null
          created_at?: string
          current_weight_kg?: number | null
          daily_calories?: number | null
          display_name?: string | null
          fat_g?: number | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          goal?: Database["public"]["Enums"]["goal_type"] | null
          goal_weight_kg?: number | null
          health_integration_preference?: string | null
          height_cm?: number | null
          id?: string
          language?: string
          maintenance_calories?: number | null
          onboarding_completed?: boolean
          protein_g?: number | null
          updated_at?: string
          weekly_change_kg?: number | null
          workout_frequency?: number | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          enabled_meal: boolean
          enabled_streak: boolean
          enabled_workout: boolean
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          enabled_meal?: boolean
          enabled_streak?: boolean
          enabled_workout?: boolean
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          enabled_meal?: boolean
          enabled_streak?: boolean
          enabled_workout?: boolean
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          provider: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          active_seconds: number | null
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          name: string
          notes: string | null
          rpe: number | null
          started_at: string
          template_id: string | null
          total_reps: number | null
          total_volume_kg: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_seconds?: number | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          name: string
          notes?: string | null
          rpe?: number | null
          started_at?: string
          template_id?: string | null
          total_reps?: number | null
          total_volume_kg?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_seconds?: number | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          rpe?: number | null
          started_at?: string
          template_id?: string | null
          total_reps?: number | null
          total_volume_kg?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_sets: {
        Row: {
          completed_at: string
          created_at: string
          estimated_1rm: number | null
          exercise_key: string
          exercise_name: string
          id: string
          is_pr_1rm: boolean
          is_pr_volume: boolean
          is_pr_weight: boolean
          is_warmup: boolean
          reps: number | null
          rest_seconds: number | null
          session_id: string
          set_index: number
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          completed_at?: string
          created_at?: string
          estimated_1rm?: number | null
          exercise_key: string
          exercise_name: string
          id?: string
          is_pr_1rm?: boolean
          is_pr_volume?: boolean
          is_pr_weight?: boolean
          is_warmup?: boolean
          reps?: number | null
          rest_seconds?: number | null
          session_id: string
          set_index: number
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          completed_at?: string
          created_at?: string
          estimated_1rm?: number | null
          exercise_key?: string
          exercise_name?: string
          id?: string
          is_pr_1rm?: boolean
          is_pr_volume?: boolean
          is_pr_weight?: boolean
          is_warmup?: boolean
          reps?: number | null
          rest_seconds?: number | null
          session_id?: string
          set_index?: number
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_level:
        | "sedentary"
        | "light"
        | "moderate"
        | "very_active"
        | "athlete"
      gender_type: "male" | "female" | "other"
      goal_type: "lose" | "maintain" | "gain"
      subscription_status:
        | "active"
        | "trialing"
        | "canceled"
        | "past_due"
        | "inactive"
      subscription_tier: "free" | "premium"
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
      activity_level: [
        "sedentary",
        "light",
        "moderate",
        "very_active",
        "athlete",
      ],
      gender_type: ["male", "female", "other"],
      goal_type: ["lose", "maintain", "gain"],
      subscription_status: [
        "active",
        "trialing",
        "canceled",
        "past_due",
        "inactive",
      ],
      subscription_tier: ["free", "premium"],
    },
  },
} as const
