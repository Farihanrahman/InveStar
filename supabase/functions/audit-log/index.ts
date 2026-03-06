import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip',
};

// Action types for categorization
const VALID_ACTION_TYPES = [
  'auth',           // Login, logout, signup, password changes
  'wallet',         // Wallet creation, transfers, balance changes
  'trading',        // Buy, sell, virtual trades
  'settings',       // Profile updates, preferences
  'security',       // 2FA, password changes, security settings
  'admin',          // Admin actions
  'navigation',     // Page views (optional)
] as const;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Parse request body
    const { action, actionType, details } = await req.json();

    if (!action || typeof action !== 'string') {
      throw new Error('Action is required');
    }

    if (!actionType || !VALID_ACTION_TYPES.includes(actionType)) {
      throw new Error(`Invalid action type. Must be one of: ${VALID_ACTION_TYPES.join(', ')}`);
    }

    // Extract IP address from various headers (proxies, load balancers)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    
    let ipAddress = cfConnectingIp || realIp || forwardedFor?.split(',')[0]?.trim() || null;
    
    // Validate IP format (basic check)
    if (ipAddress && !/^[\d.:a-fA-F]+$/.test(ipAddress)) {
      ipAddress = null;
    }

    // Get user agent
    const userAgent = req.headers.get('user-agent') || null;

    // Sanitize details - remove any sensitive data
    const sanitizedDetails = details ? {
      ...details,
      // Remove any password fields if accidentally included
      password: undefined,
      secret: undefined,
      token: undefined,
      apiKey: undefined,
    } : {};

    console.log(`Audit log: ${actionType}/${action} for user ${user.id.substring(0, 8)}...`);

    // Insert audit log using service role (bypasses RLS)
    const { error: insertError } = await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: action.substring(0, 255), // Limit action length
        action_type: actionType,
        details: sanitizedDetails,
        ip_address: ipAddress,
        user_agent: userAgent?.substring(0, 500), // Limit user agent length
      });

    if (insertError) {
      console.error('Failed to insert audit log:', insertError);
      throw new Error('Failed to record audit log');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Action logged' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Audit log error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});