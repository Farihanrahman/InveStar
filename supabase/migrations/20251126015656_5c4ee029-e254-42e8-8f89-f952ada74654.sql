-- Add Stellar wallet address to wallet_balances
ALTER TABLE public.wallet_balances 
ADD COLUMN IF NOT EXISTS stellar_public_key text,
ADD COLUMN IF NOT EXISTS stellar_secret_key_encrypted text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wallet_balances_stellar_public_key 
ON public.wallet_balances(stellar_public_key);

-- Update trigger for profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.wallet_balances (user_id, balance_usd, balance_usdc)
  VALUES (new.id, 0.00, 0.000000);
  RETURN new;
END;
$$;

-- Create trigger on auth.users for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_profile();