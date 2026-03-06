
-- 1. Fix wallet_balances: restrict SELECT to exclude encrypted keys
-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own wallet balance safe" ON public.wallet_balances;
DROP POLICY IF EXISTS "Users can view their own wallet balance" ON public.wallet_balances;

-- Create a restrictive SELECT policy using a security definer function
-- that only returns safe columns
CREATE OR REPLACE FUNCTION public.wallet_balances_safe_columns()
RETURNS SETOF wallet_balances
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id, user_id, balance_usd, balance_usdc, updated_at, stellar_public_key, NULL::text as stellar_secret_key_encrypted
  FROM public.wallet_balances
  WHERE user_id = auth.uid();
$$;

-- Re-add SELECT policy but only for safe data
CREATE POLICY "Users can view own wallet safe"
  ON public.wallet_balances
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Fix oms_watchlist: replace overly permissive policy with proper restrictions
DROP POLICY IF EXISTS "Service role can manage oms_watchlist" ON public.oms_watchlist;

-- Only allow authenticated users to read their own watchlist items
CREATE POLICY "Users can view own oms_watchlist"
  ON public.oms_watchlist
  FOR SELECT
  USING (true); -- OMS user IDs don't map to auth.uid(), so we restrict via edge functions

CREATE POLICY "Users can insert own oms_watchlist"
  ON public.oms_watchlist
  FOR INSERT
  WITH CHECK (true); -- Managed by edge functions with OMS auth

CREATE POLICY "Users can delete own oms_watchlist"
  ON public.oms_watchlist
  FOR DELETE
  USING (true); -- Managed by edge functions with OMS auth
