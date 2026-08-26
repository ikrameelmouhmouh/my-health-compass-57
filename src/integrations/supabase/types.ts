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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      activity_sessions: {
        Row: {
          activity_id: string
          activity_name: string
          created_at: string
          distance_m: number | null
          duration_seconds: number
          ended_at: string
          heart_rate_avg: number | null
          heart_rate_max: number | null
          id: string
          kcal: number | null
          notes: string | null
          paused_seconds: number
          source: string
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id: string
          activity_name: string
          created_at?: string
          distance_m?: number | null
          duration_seconds: number
          ended_at: string
          heart_rate_avg?: number | null
          heart_rate_max?: number | null
          id?: string
          kcal?: number | null
          notes?: string | null
          paused_seconds?: number
          source?: string
          started_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          activity_name?: string
          created_at?: string
          distance_m?: number | null
          duration_seconds?: number
          ended_at?: string
          heart_rate_avg?: number | null
          heart_rate_max?: number | null
          id?: string
          kcal?: number | null
          notes?: string | null
          paused_seconds?: number
          source?: string
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          ends_on: string
          id: string
          metric: string
          starts_on: string
          target: number | null
          title: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          ends_on: string
          id?: string
          metric: string
          starts_on: string
          target?: number | null
          title: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          ends_on?: string
          id?: string
          metric?: string
          starts_on?: string
          target?: number | null
          title?: string
          visibility?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_frame_jobs: {
        Row: {
          error: string | null
          exercise_id: string
          feedback: string | null
          prompt: string | null
          status: string
          updated_at: string
        }
        Insert: {
          error?: string | null
          exercise_id: string
          feedback?: string | null
          prompt?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          error?: string | null
          exercise_id?: string
          feedback?: string | null
          prompt?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      friend_invites: {
        Row: {
          created_at: string
          email: string
          id: string
          inviter_id: string
          message: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          inviter_id: string
          message?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          inviter_id?: string
          message?: string | null
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          requested_by: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          requested_by: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          requested_by?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          created_at: string
          day_index: number
          id: string
          meals: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_index: number
          id?: string
          meals?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_index?: number
          id?: string
          meals?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          day: string | null
          id: string
          meta: Json
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          day?: string | null
          id?: string
          meta?: Json
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          day?: string | null
          id?: string
          meta?: Json
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          body: string | null
          comment_count: number
          created_at: string
          id: string
          image_url: string | null
          kind: string
          like_count: number
          payload: Json
          title: string | null
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          body?: string | null
          comment_count?: number
          created_at?: string
          id?: string
          image_url?: string | null
          kind: string
          like_count?: number
          payload?: Json
          title?: string | null
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          body?: string | null
          comment_count?: number
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: string
          like_count?: number
          payload?: Json
          title?: string | null
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"] | null
          age: number | null
          bio: string | null
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
          username: string | null
          weekly_change_kg: number | null
          workout_frequency: number | null
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          age?: number | null
          bio?: string | null
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
          username?: string | null
          weekly_change_kg?: number | null
          workout_frequency?: number | null
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          age?: number | null
          bio?: string | null
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
          username?: string | null
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
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      public_profiles: {
        Row: {
          bio: string | null
          display_name: string | null
          id: string | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      are_friends: { Args: { _a: string; _b: string }; Returns: boolean }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_challenge_participant: {
        Args: { _cid: string; _uid: string }
        Returns: boolean
      }
      public_profiles_fn: {
        Args: never
        Returns: {
          bio: string
          display_name: string
          id: string
          username: string
        }[]
      }
    }
    Enums: {
      activity_level:
        | "sedentary"
        | "light"
        | "moderate"
        | "very_active"
        | "athlete"
      app_role: "admin" | "moderator" | "user"
      gender_type: "male" | "female" | "other"
      goal_type: "lose" | "maintain" | "gain"
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
      app_role: ["admin", "moderator", "user"],
      gender_type: ["male", "female", "other"],
      goal_type: ["lose", "maintain", "gain"],
    },
  },
} as const
