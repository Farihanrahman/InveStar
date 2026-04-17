CREATE TABLE public.telegram_chat_prefs (
  chat_id bigint PRIMARY KEY,
  lang text NOT NULL DEFAULT 'en',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_chat_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.telegram_chat_prefs
  FOR ALL USING (false);
