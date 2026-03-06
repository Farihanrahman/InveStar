-- Add 'stellar' to payment_method constraint for USDC transfers
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_payment_method_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_payment_method_check 
CHECK (payment_method = ANY (ARRAY['stripe', 'paypal', 'ach', 'wire', 'crypto', 'stellar', 'anchor_circle', 'anchor_moneygram']));