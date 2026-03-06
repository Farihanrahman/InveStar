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
      ai_conversations: {
        Row: {
          created_at: string | null
          id: string
          messages: Json
          mode: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          messages?: Json
          mode?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          messages?: Json
          mode?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          action_type: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      financial_goals: {
        Row: {
          category: string
          created_at: string
          current_amount: number
          deadline: string | null
          id: string
          name: string
          status: string
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          name: string
          status?: string
          target_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          name?: string
          status?: string
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investor_profiles: {
        Row: {
          answers: Json
          created_at: string
          description: string
          id: string
          investor_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          description: string
          id?: string
          investor_type: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          description?: string
          id?: string
          investor_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      net_worth_assets: {
        Row: {
          created_at: string
          icon: string
          id: string
          name: string
          type: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          name: string
          type: string
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      oms_watchlist: {
        Row: {
          created_at: string
          id: string
          oms_user_id: string
          security_code: string
          security_sub_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          oms_user_id: string
          security_code: string
          security_sub_type: string
        }
        Update: {
          created_at?: string
          id?: string
          oms_user_id?: string
          security_code?: string
          security_sub_type?: string
        }
        Relationships: []
      }
      portfolio_holdings: {
        Row: {
          avg_cost: number
          created_at: string
          id: string
          name: string
          shares: number
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_cost: number
          created_at?: string
          id?: string
          name: string
          shares: number
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_cost?: number
          created_at?: string
          id?: string
          name?: string
          shares?: number
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_transactions: {
        Row: {
          created_at: string
          id: string
          name: string | null
          price: number
          shares: number
          symbol: string
          total: number
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          price: number
          shares: number
          symbol: string
          total: number
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          price?: number
          shares?: number
          symbol?: string
          total?: number
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          status: string
          symbol: string
          target_price: number
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          status?: string
          symbol: string
          target_price: number
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          status?: string
          symbol?: string
          target_price?: number
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      remit_audit: {
        Row: {
          amount_bdt: number
          amount_usd: number
          bfiu_ref: string | null
          executed_at: string | null
          id: string
          kyc_status: string | null
          method: string
          purpose: string
          recipient_mobile: string
          recipient_name: string
          sender_ip: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount_bdt: number
          amount_usd: number
          bfiu_ref?: string | null
          executed_at?: string | null
          id?: string
          kyc_status?: string | null
          method: string
          purpose: string
          recipient_mobile: string
          recipient_name: string
          sender_ip?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount_bdt?: number
          amount_usd?: number
          bfiu_ref?: string | null
          executed_at?: string | null
          id?: string
          kyc_status?: string | null
          method?: string
          purpose?: string
          recipient_mobile?: string
          recipient_name?: string
          sender_ip?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remit_audit_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "remit_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      remit_recipients: {
        Row: {
          account_no: string | null
          bank_name: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          is_verified: boolean | null
          method: string
          mobile: string
          name: string
          user_id: string
        }
        Insert: {
          account_no?: string | null
          bank_name?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_verified?: boolean | null
          method?: string
          mobile: string
          name: string
          user_id: string
        }
        Update: {
          account_no?: string | null
          bank_name?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_verified?: boolean | null
          method?: string
          mobile?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      remit_schedules: {
        Row: {
          amount_usd: number
          created_at: string | null
          day_of_month: number | null
          frequency: string
          id: string
          is_active: boolean | null
          next_run_date: string | null
          note: string | null
          purpose: string | null
          recipient_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_usd: number
          created_at?: string | null
          day_of_month?: number | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          next_run_date?: string | null
          note?: string | null
          purpose?: string | null
          recipient_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_usd?: number
          created_at?: string | null
          day_of_month?: number | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          next_run_date?: string | null
          note?: string | null
          purpose?: string | null
          recipient_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remit_schedules_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "remit_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      remit_transactions: {
        Row: {
          amount_bdt: number
          amount_usd: number
          exchange_rate: number
          executed_at: string | null
          fee_usd: number
          id: string
          is_scheduled: boolean | null
          method: string
          net_bdt: number
          note: string | null
          provider_ref: string | null
          purpose: string | null
          recipient_id: string
          schedule_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount_bdt: number
          amount_usd: number
          exchange_rate: number
          executed_at?: string | null
          fee_usd?: number
          id?: string
          is_scheduled?: boolean | null
          method: string
          net_bdt: number
          note?: string | null
          provider_ref?: string | null
          purpose?: string | null
          recipient_id: string
          schedule_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount_bdt?: number
          amount_usd?: number
          exchange_rate?: number
          executed_at?: string | null
          fee_usd?: number
          id?: string
          is_scheduled?: boolean | null
          method?: string
          net_bdt?: number
          note?: string | null
          provider_ref?: string | null
          purpose?: string | null
          recipient_id?: string
          schedule_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remit_transactions_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "remit_recipients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remit_transactions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "remit_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          notes: string | null
          payment_method: string | null
          status: string
          stripe_session_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string
          stripe_session_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string
          stripe_session_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      virtual_orders: {
        Row: {
          created_at: string
          id: string
          limit_price: number
          order_type: string
          quantity: number
          status: string
          symbol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          limit_price: number
          order_type: string
          quantity: number
          status?: string
          symbol: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          limit_price?: number
          order_type?: string
          quantity?: number
          status?: string
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      virtual_portfolios: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          virtual_balance: number
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          virtual_balance?: number
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          virtual_balance?: number
        }
        Relationships: []
      }
      virtual_trades: {
        Row: {
          created_at: string
          id: string
          price: number
          quantity: number
          symbol: string
          total: number
          trade_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          price: number
          quantity: number
          symbol: string
          total: number
          trade_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          price?: number
          quantity?: number
          symbol?: string
          total?: number
          trade_type?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_balances: {
        Row: {
          balance_usd: number
          balance_usdc: number
          id: string
          oms_user_id: string | null
          stellar_public_key: string | null
          stellar_secret_key_encrypted: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_usd?: number
          balance_usdc?: number
          id?: string
          oms_user_id?: string | null
          stellar_public_key?: string | null
          stellar_secret_key_encrypted?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_usd?: number
          balance_usdc?: number
          id?: string
          oms_user_id?: string | null
          stellar_public_key?: string | null
          stellar_secret_key_encrypted?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string
          id: string
          symbol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          symbol: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests?: number
          p_window_seconds?: number
        }
        Returns: boolean
      }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      wallet_balances_safe_columns: {
        Args: never
        Returns: {
          balance_usd: number
          balance_usdc: number
          id: string
          oms_user_id: string | null
          stellar_public_key: string | null
          stellar_secret_key_encrypted: string | null
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "wallet_balances"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
