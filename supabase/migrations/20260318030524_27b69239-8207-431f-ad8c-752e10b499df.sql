
-- Telegram bot state (singleton)
CREATE TABLE IF NOT EXISTS public.telegram_bot_state (
  id int PRIMARY KEY CHECK (id = 1),
  update_offset bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.telegram_bot_state (id, update_offset) VALUES (1, 0) ON CONFLICT DO NOTHING;

-- Telegram messages
CREATE TABLE IF NOT EXISTS public.telegram_messages (
  update_id bigint PRIMARY KEY,
  chat_id bigint NOT NULL,
  text text,
  raw_update jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telegram_messages_chat_id ON public.telegram_messages (chat_id);

-- RLS
ALTER TABLE public.telegram_bot_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;

-- Only service role can access these tables (used by edge functions)
CREATE POLICY "Service role only" ON public.telegram_bot_state FOR ALL USING (false);
CREATE POLICY "Service role only" ON public.telegram_messages FOR ALL USING (false);
