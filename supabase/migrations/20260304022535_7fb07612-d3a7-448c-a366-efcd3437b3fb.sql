
ALTER TABLE public.wallet_balances ADD COLUMN IF NOT EXISTS oms_user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_wallet_balances_oms_user_id ON public.wallet_balances(oms_user_id) WHERE oms_user_id IS NOT NULL;
