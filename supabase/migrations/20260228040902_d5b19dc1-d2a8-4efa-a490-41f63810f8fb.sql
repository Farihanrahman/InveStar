
-- ══ 1. REMIT RECIPIENTS ══
CREATE TABLE IF NOT EXISTS public.remit_recipients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  name            TEXT NOT NULL,
  mobile          TEXT NOT NULL,
  method          TEXT NOT NULL DEFAULT 'bkash',
  bank_name       TEXT,
  account_no      TEXT,
  is_default      BOOLEAN DEFAULT FALSE,
  is_verified     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Validation trigger for method
CREATE OR REPLACE FUNCTION public.validate_remit_recipient_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.method NOT IN ('bkash', 'nagad', 'bank', 'rocket') THEN
    RAISE EXCEPTION 'Invalid method: %. Must be bkash, nagad, bank, or rocket.', NEW.method;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_recipient_method
  BEFORE INSERT OR UPDATE ON public.remit_recipients
  FOR EACH ROW EXECUTE FUNCTION public.validate_remit_recipient_method();

ALTER TABLE public.remit_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_recipients" ON public.remit_recipients
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ══ 2. REMIT SCHEDULES ══
CREATE TABLE IF NOT EXISTS public.remit_schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  recipient_id    UUID NOT NULL REFERENCES public.remit_recipients(id),
  amount_usd      DECIMAL(10,2) NOT NULL,
  frequency       TEXT NOT NULL DEFAULT 'monthly',
  day_of_month    INTEGER DEFAULT 1,
  next_run_date   DATE,
  is_active       BOOLEAN DEFAULT TRUE,
  purpose         TEXT DEFAULT 'family_support',
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.validate_remit_schedule()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.frequency NOT IN ('weekly', 'fortnightly', 'monthly') THEN
    RAISE EXCEPTION 'Invalid frequency: %', NEW.frequency;
  END IF;
  IF NEW.purpose NOT IN ('family_support', 'education', 'medical', 'business', 'investment') THEN
    RAISE EXCEPTION 'Invalid purpose: %', NEW.purpose;
  END IF;
  IF NEW.day_of_month IS NOT NULL AND (NEW.day_of_month < 1 OR NEW.day_of_month > 28) THEN
    RAISE EXCEPTION 'day_of_month must be between 1 and 28';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_schedule
  BEFORE INSERT OR UPDATE ON public.remit_schedules
  FOR EACH ROW EXECUTE FUNCTION public.validate_remit_schedule();

ALTER TABLE public.remit_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_schedules" ON public.remit_schedules
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ══ 3. REMIT TRANSACTIONS ══
CREATE TABLE IF NOT EXISTS public.remit_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  schedule_id     UUID REFERENCES public.remit_schedules(id),
  recipient_id    UUID NOT NULL REFERENCES public.remit_recipients(id),
  amount_usd      DECIMAL(10,2) NOT NULL,
  amount_bdt      DECIMAL(12,2) NOT NULL,
  exchange_rate   DECIMAL(10,4) NOT NULL,
  fee_usd         DECIMAL(8,2) NOT NULL DEFAULT 0,
  net_bdt         DECIMAL(12,2) NOT NULL,
  method          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  provider_ref    TEXT,
  purpose         TEXT DEFAULT 'family_support',
  note            TEXT,
  is_scheduled    BOOLEAN DEFAULT FALSE,
  executed_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.validate_remit_transaction_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'processing', 'completed', 'failed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_transaction_status
  BEFORE INSERT OR UPDATE ON public.remit_transactions
  FOR EACH ROW EXECUTE FUNCTION public.validate_remit_transaction_status();

ALTER TABLE public.remit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_transactions" ON public.remit_transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ══ 4. REMIT AUDIT (BFIU compliance) ══
CREATE TABLE IF NOT EXISTS public.remit_audit (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL,
  transaction_id   UUID REFERENCES public.remit_transactions(id),
  amount_usd       DECIMAL(10,2) NOT NULL,
  amount_bdt       DECIMAL(12,2) NOT NULL,
  recipient_name   TEXT NOT NULL,
  recipient_mobile TEXT NOT NULL,
  method           TEXT NOT NULL,
  purpose          TEXT NOT NULL,
  kyc_status       TEXT DEFAULT 'verified',
  bfiu_ref         TEXT,
  sender_ip        TEXT,
  executed_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.remit_audit ENABLE ROW LEVEL SECURITY;
-- Users can read their own audit entries but NOT modify/delete
CREATE POLICY "read_own_audit" ON public.remit_audit
  FOR SELECT USING (auth.uid() = user_id);
-- Service role inserts audit entries (from edge functions)
CREATE POLICY "service_insert_audit" ON public.remit_audit
  FOR INSERT WITH CHECK (true);

-- ══ 5. AI CONVERSATIONS ══
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  messages    JSONB NOT NULL DEFAULT '[]'::JSONB,
  mode        TEXT DEFAULT 'general',
  title       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_conversations" ON public.ai_conversations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ══ INDEXES ══
CREATE INDEX IF NOT EXISTS idx_schedules_next_run ON public.remit_schedules(next_run_date) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.remit_transactions(user_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.remit_audit(user_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.ai_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipients_user ON public.remit_recipients(user_id);

-- ══ UPDATE TRIGGERS ══
CREATE TRIGGER update_remit_schedules_updated_at
  BEFORE UPDATE ON public.remit_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
