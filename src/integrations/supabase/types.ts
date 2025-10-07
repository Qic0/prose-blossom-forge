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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_penalty_log: {
        Row: {
          admin_id: string | null
          created_at: string | null
          dispatcher_id: string | null
          id: string
          penalty_amount: number | null
          reason: string | null
          task_id: number | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          dispatcher_id?: string | null
          id?: string
          penalty_amount?: number | null
          reason?: string | null
          task_id?: number | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          dispatcher_id?: string | null
          id?: string
          penalty_amount?: number | null
          reason?: string | null
          task_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_penalty_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["uuid_user"]
          },
          {
            foreignKeyName: "admin_penalty_log_dispatcher_id_fkey"
            columns: ["dispatcher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["uuid_user"]
          },
          {
            foreignKeyName: "admin_penalty_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "zadachi"
            referencedColumns: ["id_zadachi"]
          },
        ]
      }
      automation_settings: {
        Row: {
          created_at: string
          dispatcher_id: string | null
          dispatcher_percentage: number | null
          duration_days: number | null
          id: string
          payment_amount: number | null
          responsible_user_id: string | null
          stage_id: string
          stage_name: string
          task_description_template: string
          task_title_template: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dispatcher_id?: string | null
          dispatcher_percentage?: number | null
          duration_days?: number | null
          id?: string
          payment_amount?: number | null
          responsible_user_id?: string | null
          stage_id: string
          stage_name: string
          task_description_template?: string
          task_title_template?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dispatcher_id?: string | null
          dispatcher_percentage?: number | null
          duration_days?: number | null
          id?: string
          payment_amount?: number | null
          responsible_user_id?: string | null
          stage_id?: string
          stage_name?: string
          task_description_template?: string
          task_title_template?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_settings_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["uuid_user"]
          },
        ]
      }
      order_attachments: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          order_id: string
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          order_id: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          order_id?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_attachments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "zakazi"
            referencedColumns: ["uuid_zakaza"]
          },
          {
            foreignKeyName: "order_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["uuid_user"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          completed_tasks: Json[] | null
          created_at: string | null
          current_task: string | null
          email: string
          full_name: string
          id_user: number
          last_seen: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          salary: number | null
          status: Database["public"]["Enums"]["user_status"] | null
          updated_at: string | null
          uuid_user: string
        }
        Insert: {
          avatar_url?: string | null
          completed_tasks?: Json[] | null
          created_at?: string | null
          current_task?: string | null
          email: string
          full_name: string
          id_user: number
          last_seen?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          salary?: number | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
          uuid_user?: string
        }
        Update: {
          avatar_url?: string | null
          completed_tasks?: Json[] | null
          created_at?: string | null
          current_task?: string | null
          email?: string
          full_name?: string
          id_user?: number
          last_seen?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          salary?: number | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
          uuid_user?: string
        }
        Relationships: []
      }
      zadachi: {
        Row: {
          author_id: string | null
          checklist_photo: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          dispatcher_id: string | null
          dispatcher_percentage: number | null
          dispatcher_reward_amount: number | null
          dispatcher_reward_applied: boolean | null
          dispatcher_reward_applied_at: string | null
          due_date: string
          execution_time_seconds: number | null
          id_zadachi: number
          image_url: string | null
          is_locked: boolean | null
          original_deadline: string | null
          penalty_applied: boolean | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          responsible_user_id: string | null
          review_returns: Json | null
          salary: number | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          uuid_zadachi: string
          zakaz_id: number | null
        }
        Insert: {
          author_id?: string | null
          checklist_photo?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          dispatcher_id?: string | null
          dispatcher_percentage?: number | null
          dispatcher_reward_amount?: number | null
          dispatcher_reward_applied?: boolean | null
          dispatcher_reward_applied_at?: string | null
          due_date: string
          execution_time_seconds?: number | null
          id_zadachi: number
          image_url?: string | null
          is_locked?: boolean | null
          original_deadline?: string | null
          penalty_applied?: boolean | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          responsible_user_id?: string | null
          review_returns?: Json | null
          salary?: number | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          uuid_zadachi?: string
          zakaz_id?: number | null
        }
        Update: {
          author_id?: string | null
          checklist_photo?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          dispatcher_id?: string | null
          dispatcher_percentage?: number | null
          dispatcher_reward_amount?: number | null
          dispatcher_reward_applied?: boolean | null
          dispatcher_reward_applied_at?: string | null
          due_date?: string
          execution_time_seconds?: number | null
          id_zadachi?: number
          image_url?: string | null
          is_locked?: boolean | null
          original_deadline?: string | null
          penalty_applied?: boolean | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          responsible_user_id?: string | null
          review_returns?: Json | null
          salary?: number | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          uuid_zadachi?: string
          zakaz_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_zadachi_zakaz"
            columns: ["zakaz_id"]
            isOneToOne: false
            referencedRelation: "zakazi"
            referencedColumns: ["id_zakaza"]
          },
          {
            foreignKeyName: "zadachi_dispatcher_id_fkey"
            columns: ["dispatcher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["uuid_user"]
          },
        ]
      }
      zakazi: {
        Row: {
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string | null
          created_by: number | null
          description: string | null
          due_date: string | null
          id_zakaza: number
          priority: Database["public"]["Enums"]["order_priority"] | null
          status: string | null
          title: string
          total_amount: number | null
          updated_at: string | null
          uuid_zakaza: string
          vse_zadachi: number[] | null
        }
        Insert: {
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string | null
          created_by?: number | null
          description?: string | null
          due_date?: string | null
          id_zakaza: number
          priority?: Database["public"]["Enums"]["order_priority"] | null
          status?: string | null
          title: string
          total_amount?: number | null
          updated_at?: string | null
          uuid_zakaza?: string
          vse_zadachi?: number[] | null
        }
        Update: {
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string | null
          created_by?: number | null
          description?: string | null
          due_date?: string | null
          id_zakaza?: number
          priority?: Database["public"]["Enums"]["order_priority"] | null
          status?: string | null
          title?: string
          total_amount?: number | null
          updated_at?: string | null
          uuid_zakaza?: string
          vse_zadachi?: number[] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_completed_task_and_salary: {
        Args: {
          p_has_penalty: boolean
          p_payment: number
          p_task_id: number
          p_worker_id: string
        }
        Returns: undefined
      }
      cleanup_offline_users: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_filtered_order_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          client_email: string
          client_name: string
          client_phone: string
          created_at: string
          created_by: number
          description: string
          due_date: string
          id_zakaza: number
          priority: Database["public"]["Enums"]["order_priority"]
          status: string
          title: string
          total_amount: number
          updated_at: string
          uuid_zakaza: string
          vse_zadachi: Json[]
        }[]
      }
      get_order_for_employee: {
        Args: { order_id: number }
        Returns: {
          client_name: string
          created_at: string
          description: string
          due_date: string
          id_zakaza: number
          priority: Database["public"]["Enums"]["order_priority"]
          status: string
          title: string
          total_amount: number
          updated_at: string
          uuid_zakaza: string
        }[]
      }
      get_user_last_sign_in: {
        Args: { user_uuid: string }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      set_user_offline: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      set_user_online: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      update_user_activity: {
        Args: { user_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      order_priority: "low" | "medium" | "high"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "under_review"
      user_role:
        | "admin"
        | "manager"
        | "sawyer"
        | "edger"
        | "additive"
        | "grinder"
        | "painter"
        | "packer"
        | "otk"
        | "dispatcher"
        | "Диспетчер"
      user_status: "online" | "offline"
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
      order_priority: ["low", "medium", "high"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: [
        "pending",
        "in_progress",
        "completed",
        "cancelled",
        "under_review",
      ],
      user_role: [
        "admin",
        "manager",
        "sawyer",
        "edger",
        "additive",
        "grinder",
        "painter",
        "packer",
        "otk",
        "dispatcher",
        "Диспетчер",
      ],
      user_status: ["online", "offline"],
    },
  },
} as const
