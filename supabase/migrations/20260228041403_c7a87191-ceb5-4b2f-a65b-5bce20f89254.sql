
-- Fix: Drop overly permissive INSERT policy on remit_audit and replace with restrictive one
-- Only authenticated users can insert (edge functions use service role which bypasses RLS)
DROP POLICY IF EXISTS "service_insert_audit" ON public.remit_audit;

-- No INSERT policy for regular users - only service role (bypasses RLS) can insert audit entries
-- This is the correct pattern: edge functions with service role key bypass RLS entirely
