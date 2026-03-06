-- Update the trigger function to create portfolios with $10,000 starting balance
CREATE OR REPLACE FUNCTION public.handle_new_virtual_trader()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.virtual_portfolios (user_id, virtual_balance)
  VALUES (new.id, 10000.00);
  RETURN new;
END;
$function$;