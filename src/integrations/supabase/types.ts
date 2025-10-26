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
      assets: {
        Row: {
          ai_params: Json | null
          asset_type: string
          cdn_url: string | null
          created_at: string
          created_by: string | null
          duration: number | null
          file_size: number | null
          height: number | null
          id: string
          metadata: Json | null
          mime_type: string | null
          name: string
          provider: string | null
          storage_url: string
          width: number | null
          workspace_id: string
        }
        Insert: {
          ai_params?: Json | null
          asset_type: string
          cdn_url?: string | null
          created_at?: string
          created_by?: string | null
          duration?: number | null
          file_size?: number | null
          height?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          name: string
          provider?: string | null
          storage_url: string
          width?: number | null
          workspace_id: string
        }
        Update: {
          ai_params?: Json | null
          asset_type?: string
          cdn_url?: string | null
          created_at?: string
          created_by?: string | null
          duration?: number | null
          file_size?: number | null
          height?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          name?: string
          provider?: string | null
          storage_url?: string
          width?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_flows: {
        Row: {
          actions_config: Json
          conditions_config: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          trigger_config: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          actions_config: Json
          conditions_config?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_config: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          actions_config?: Json
          conditions_config?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_config?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_flows_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_runs: {
        Row: {
          created_at: string
          credits_actual: number | null
          credits_held: number | null
          error_message: string | null
          finished_at: string | null
          flow_id: string
          id: string
          started_at: string
          status: string
          steps: Json | null
          trigger_data: Json | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          credits_actual?: number | null
          credits_held?: number | null
          error_message?: string | null
          finished_at?: string | null
          flow_id: string
          id?: string
          started_at?: string
          status?: string
          steps?: Json | null
          trigger_data?: Json | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          credits_actual?: number | null
          credits_held?: number | null
          error_message?: string | null
          finished_at?: string | null
          flow_id?: string
          id?: string
          started_at?: string
          status?: string
          steps?: Json | null
          trigger_data?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "automation_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_tokens: {
        Row: {
          access_token: string
          channel_id: string
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json | null
          refresh_token: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          access_token: string
          channel_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          refresh_token?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          access_token?: string
          channel_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          refresh_token?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_tokens_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          account_id: string
          account_name: string
          connected_at: string
          created_at: string
          created_by: string | null
          id: string
          metadata: Json | null
          provider: string
          scopes: string[] | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          account_id: string
          account_name: string
          connected_at?: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          provider: string
          scopes?: string[] | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          account_id?: string
          account_name?: string
          connected_at?: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          scopes?: string[] | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      contents: {
        Row: {
          ai_params: Json | null
          content: string | null
          content_type: string
          created_at: string
          created_by: string | null
          id: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ai_params?: Json | null
          content?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ai_params?: Json | null
          content?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: string
          status: string
          token: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          role: string
          status?: string
          token: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          status?: string
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          asset_id: string | null
          completed_at: string | null
          content_id: string | null
          created_at: string
          created_by: string | null
          credits_actual: number | null
          credits_estimated: number
          error_message: string | null
          id: string
          input_params: Json
          job_type: string
          output_data: Json | null
          progress: number | null
          provider: string | null
          started_at: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          asset_id?: string | null
          completed_at?: string | null
          content_id?: string | null
          created_at?: string
          created_by?: string | null
          credits_actual?: number | null
          credits_estimated: number
          error_message?: string | null
          id?: string
          input_params: Json
          job_type: string
          output_data?: Json | null
          progress?: number | null
          provider?: string | null
          started_at?: string | null
          status?: string
          workspace_id: string
        }
        Update: {
          asset_id?: string | null
          completed_at?: string | null
          content_id?: string | null
          created_at?: string
          created_by?: string | null
          credits_actual?: number | null
          credits_estimated?: number
          error_message?: string | null
          id?: string
          input_params?: Json
          job_type?: string
          output_data?: Json | null
          progress?: number | null
          provider?: string | null
          started_at?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          role: string
          scopes: Json | null
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          scopes?: Json | null
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          scopes?: Json | null
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          payload: Json | null
          read_at: string | null
          title: string
          type: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          payload?: Json | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          payload?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          asset_ids: string[] | null
          caption: string
          content_id: string | null
          created_at: string
          created_by: string | null
          credits_actual: number | null
          credits_held: number | null
          error_message: string | null
          id: string
          metadata: Json | null
          provider_targets: string[]
          results: Json | null
          schedule_at: string
          status: string
          timezone: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          asset_ids?: string[] | null
          caption: string
          content_id?: string | null
          created_at?: string
          created_by?: string | null
          credits_actual?: number | null
          credits_held?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider_targets: string[]
          results?: Json | null
          schedule_at: string
          status?: string
          timezone?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          asset_ids?: string[] | null
          caption?: string
          content_id?: string | null
          created_at?: string
          created_by?: string | null
          credits_actual?: number | null
          credits_held?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider_targets?: string[]
          results?: Json | null
          schedule_at?: string
          status?: string
          timezone?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_ledger: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          job_id: string | null
          metadata: Json | null
          transaction_type: string
          workspace_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          job_id?: string | null
          metadata?: Json | null
          transaction_type: string
          workspace_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          job_id?: string | null
          metadata?: Json | null
          transaction_type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_ledger_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_ledger_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          billing_cycle_start: string | null
          created_at: string
          held_balance: number
          id: string
          plan: string
          plan_credits_monthly: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          balance?: number
          billing_cycle_start?: string | null
          created_at?: string
          held_balance?: number
          id?: string
          plan?: string
          plan_credits_monthly?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          balance?: number
          billing_cycle_start?: string | null
          created_at?: string
          held_balance?: number
          id?: string
          plan?: string
          plan_credits_monthly?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          settings: Json | null
          slug: string
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          settings?: Json | null
          slug: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          settings?: Json | null
          slug?: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args: {
          p_amount: number
          p_description: string
          p_stripe_charge_id?: string
          p_stripe_payment_intent_id?: string
          p_workspace_id: string
        }
        Returns: undefined
      }
      finalize_credits: {
        Args: {
          p_actual_amount: number
          p_description: string
          p_held_amount: number
          p_job_id: string
          p_workspace_id: string
        }
        Returns: undefined
      }
      hold_credits: {
        Args: {
          p_amount: number
          p_description: string
          p_job_id: string
          p_workspace_id: string
        }
        Returns: boolean
      }
      user_has_workspace_access: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      user_is_workspace_admin: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
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
