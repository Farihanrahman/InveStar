
-- ── Clawbot Settings ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clawbot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  investing_style text NOT NULL DEFAULT 'growth',
  risk_level text NOT NULL DEFAULT 'moderate-high',
  time_horizon text NOT NULL DEFAULT '10+ years',
  stock_target_pct integer NOT NULL DEFAULT 65,
  reit_target_pct integer NOT NULL DEFAULT 25,
  bond_target_pct integer NOT NULL DEFAULT 10,
  max_position_pct integer NOT NULL DEFAULT 15,
  rebalance_frequency text NOT NULL DEFAULT 'quarterly',
  auto_invest_enabled boolean NOT NULL DEFAULT true,
  dca_amount_usd integer NOT NULL DEFAULT 500,
  dca_frequency text NOT NULL DEFAULT 'monthly',
  buy_on_dip boolean NOT NULL DEFAULT true,
  notify_before_invest boolean NOT NULL DEFAULT true,
  esg_filter boolean NOT NULL DEFAULT false,
  dividend_focus boolean NOT NULL DEFAULT false,
  sell_orders_allowed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.clawbot_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clawbot settings"
  ON public.clawbot_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clawbot settings"
  ON public.clawbot_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clawbot settings"
  ON public.clawbot_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── Clawbot Trade Log ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clawbot_trade_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  alpaca_order_id text,
  symbol text NOT NULL,
  side text NOT NULL DEFAULT 'buy',
  order_type text,
  notional numeric,
  qty numeric,
  status text,
  filled_avg_price numeric,
  ai_rationale text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clawbot_trade_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clawbot trades"
  ON public.clawbot_trade_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clawbot trades"
  ON public.clawbot_trade_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ── Clawbot Chat History ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clawbot_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clawbot_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clawbot chat"
  ON public.clawbot_chat_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clawbot chat"
  ON public.clawbot_chat_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ── Timestamp trigger for settings ─────────────────────────────
CREATE TRIGGER update_clawbot_settings_updated_at
  BEFORE UPDATE ON public.clawbot_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
