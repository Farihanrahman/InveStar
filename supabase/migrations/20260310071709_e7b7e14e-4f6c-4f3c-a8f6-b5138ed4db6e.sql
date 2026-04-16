
ALTER TABLE public.transactions DROP CONSTRAINT transactions_payment_method_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_payment_method_check 
  CHECK (payment_method = ANY (ARRAY['stripe'::text, 'paypal'::text, 'ach'::text, 'wire'::text, 'crypto'::text, 'stellar'::text, 'anchor_circle'::text, 'anchor_moneygram'::text, 'usdt_trc20'::text, 'usdt_solana'::text, 'usdt_ethereum'::text]));

ALTER TABLE public.transactions DROP CONSTRAINT transactions_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type = ANY (ARRAY['deposit'::text, 'withdrawal'::text, 'transfer'::text, 'usdc_deposit'::text, 'usdc_withdrawal'::text, 'usdc_transfer'::text, 'usdt_deposit'::text]));
