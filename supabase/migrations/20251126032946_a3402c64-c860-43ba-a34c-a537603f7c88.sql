-- Update default starting balance for virtual portfolios from 100000 to 10000
ALTER TABLE public.virtual_portfolios 
ALTER COLUMN virtual_balance SET DEFAULT 10000.00;