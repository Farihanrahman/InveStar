import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Resolves user identity from either a Supabase JWT or an OMS token.
 * Returns { userId, omsUserId, authProvider }.
 */
async function resolveUser(
  supabaseClient: any,
  token: string
): Promise<{ userId: string | null; omsUserId: string | null; authProvider: "supabase" | "oms" }> {
  // Try Supabase auth first
  try {
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    if (user) {
      return { userId: user.id, omsUserId: null, authProvider: "supabase" };
    }
  } catch {
    // Not a valid Supabase JWT — try OMS
  }

  // Try OMS token: decode JWT payload to extract user info
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      const omsUserId = String(payload.sub || payload.id || payload.user_id || payload.userId || "");
      if (omsUserId) {
        return { userId: null, omsUserId, authProvider: "oms" };
      }
    }
  } catch {
    // Not a valid JWT
  }

  // Last resort: treat the token itself as an OMS identifier if it's short enough
  // This handles cases where the OMS "token" is passed along with user info in body
  return { userId: null, omsUserId: null, authProvider: "oms" };
}

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const body = await req.json();
    const { action, omsUserId: bodyOmsUserId } = body;

    // Resolve user
    const { userId, omsUserId: tokenOmsUserId, authProvider } = await resolveUser(supabaseClient, token);
    const effectiveOmsUserId = bodyOmsUserId || tokenOmsUserId;

    if (!userId && !effectiveOmsUserId) {
      throw new Error("User not authenticated. Could not resolve identity from token.");
    }

    console.log(`[wallet-proxy] action=${action}, authProvider=${authProvider}, userId=${userId}, omsUserId=${effectiveOmsUserId}`);

    if (action === "get_wallet") {
      let wallet;

      if (userId) {
        // Supabase user — query by user_id
        const { data, error } = await supabaseClient
          .from("wallet_balances")
          .select("id, user_id, balance_usd, balance_usdc, stellar_public_key, updated_at, oms_user_id")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;
        wallet = data;
      } else if (effectiveOmsUserId) {
        // OMS user — query by oms_user_id
        const { data: w1, error: e1 } = await supabaseClient
          .from("wallet_balances")
          .select("id, user_id, balance_usd, balance_usdc, stellar_public_key, updated_at, oms_user_id")
          .eq("oms_user_id", effectiveOmsUserId)
          .maybeSingle();
        if (e1) throw e1;
        wallet = w1;

        // Fallback: only if omsUserId looks like a UUID, try user_id column
        if (!wallet && isUUID(effectiveOmsUserId)) {
          const { data: w2, error: e2 } = await supabaseClient
            .from("wallet_balances")
            .select("id, user_id, balance_usd, balance_usdc, stellar_public_key, updated_at, oms_user_id")
            .eq("user_id", effectiveOmsUserId)
            .maybeSingle();
          if (e2) throw e2;
          wallet = w2;

          if (wallet && !wallet.oms_user_id) {
            await supabaseClient
              .from("wallet_balances")
              .update({ oms_user_id: effectiveOmsUserId })
              .eq("user_id", effectiveOmsUserId);
            wallet.oms_user_id = effectiveOmsUserId;
          }
        }

        // If still no wallet, create one
        if (!wallet) {
          const newUserId = crypto.randomUUID();
          const { data: newWallet, error: insertError } = await supabaseClient
            .from("wallet_balances")
            .insert({
              user_id: newUserId,
              oms_user_id: effectiveOmsUserId,
              balance_usd: 0,
              balance_usdc: 0,
            })
            .select("id, user_id, balance_usd, balance_usdc, stellar_public_key, updated_at, oms_user_id")
            .single();

          if (insertError) throw insertError;
          wallet = newWallet;
        }
      }

      return new Response(
        JSON.stringify({ wallet }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (action === "get_transactions") {
      // Get the user_id from wallet
      let walletUserId = userId;
      
      if (!walletUserId && effectiveOmsUserId) {
        const { data: w1 } = await supabaseClient
          .from("wallet_balances")
          .select("user_id")
          .eq("oms_user_id", effectiveOmsUserId)
          .maybeSingle();
        walletUserId = w1?.user_id;

        if (!walletUserId && isUUID(effectiveOmsUserId)) {
          const { data: w2 } = await supabaseClient
            .from("wallet_balances")
            .select("user_id")
            .eq("user_id", effectiveOmsUserId)
            .maybeSingle();
          walletUserId = w2?.user_id;
        }
      }

      if (!walletUserId) {
        return new Response(
          JSON.stringify({ transactions: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      const { data: transactions, error } = await supabaseClient
        .from("transactions")
        .select("*")
        .eq("user_id", walletUserId)
        .order("created_at", { ascending: false })
        .limit(body.limit || 10);

      if (error) throw error;

      return new Response(
        JSON.stringify({ transactions: transactions || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    throw new Error(`Invalid action: ${action}`);
  } catch (error) {
    console.error("[wallet-proxy] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
