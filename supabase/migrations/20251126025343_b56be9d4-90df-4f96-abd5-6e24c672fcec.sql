-- Update default virtual balance to 10,000
ALTER TABLE public.virtual_portfolios 
  ALTER COLUMN virtual_balance SET DEFAULT 10000.00;

-- Update existing portfolios to 10,000 (only those still at 100,000)
UPDATE public.virtual_portfolios 
SET virtual_balance = 10000.00 
WHERE virtual_balance = 100000.00;