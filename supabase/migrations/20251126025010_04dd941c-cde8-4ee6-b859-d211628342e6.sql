-- Create virtual_portfolios table to store user portfolio data
CREATE TABLE public.virtual_portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  virtual_balance NUMERIC NOT NULL DEFAULT 100000.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create virtual_trades table to store user trades
CREATE TABLE public.virtual_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create virtual_orders table to store pending orders
CREATE TABLE public.virtual_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  order_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  limit_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.virtual_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for virtual_portfolios
CREATE POLICY "Users can view their own portfolio"
  ON public.virtual_portfolios FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolio"
  ON public.virtual_portfolios FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio"
  ON public.virtual_portfolios FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for virtual_trades
CREATE POLICY "Users can view their own trades"
  ON public.virtual_trades FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades"
  ON public.virtual_trades FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for virtual_orders
CREATE POLICY "Users can view their own orders"
  ON public.virtual_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
  ON public.virtual_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
  ON public.virtual_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orders"
  ON public.virtual_orders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_virtual_portfolio_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for virtual_portfolios
CREATE TRIGGER update_virtual_portfolios_updated_at
  BEFORE UPDATE ON public.virtual_portfolios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_virtual_portfolio_timestamp();

-- Create function to initialize virtual portfolio for new users
CREATE OR REPLACE FUNCTION public.handle_new_virtual_trader()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.virtual_portfolios (user_id, virtual_balance)
  VALUES (new.id, 100000.00);
  RETURN new;
END;
$$;

-- Create trigger to auto-create portfolio for new users
CREATE TRIGGER on_auth_user_created_virtual_portfolio
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_virtual_trader();