-- Drop existing check constraints and recreate with expanded values
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_payment_method_check;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Add updated payment_method constraint to include anchor methods
ALTER TABLE public.transactions ADD CONSTRAINT transactions_payment_method_check 
CHECK (payment_method = ANY (ARRAY['stripe', 'paypal', 'ach', 'wire', 'crypto', 'anchor_circle', 'anchor_moneygram']));

-- Add updated type constraint to include USDC transactions
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
CHECK (type = ANY (ARRAY['deposit', 'withdrawal', 'transfer', 'usdc_deposit', 'usdc_withdrawal', 'usdc_transfer']));