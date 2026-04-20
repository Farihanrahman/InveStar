import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get your custom wallet backend URL from environment
const CUSTOM_WALLET_API_URL = Deno.env.get("CUSTOM_WALLET_API_URL");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user is authenticated
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Parse request body
    const body = await req.json();
    const { action, userId, ...params } = body;

    console.log(`[custom-wallet-proxy] Action: ${action}, User: ${userId}`);

    if (!CUSTOM_WALLET_API_URL) {
      throw new Error("CUSTOM_WALLET_API_URL not configured");
    }

    // Route to appropriate endpoint on your backend
    let endpoint = "";
    const method = "POST";
    let requestBody: Record<string, unknown> = { userId, ...params };

    switch (action) {
      case "get_balance":
        endpoint = "/balance";
        // Adjust based on your API - might be GET with query param
        // endpoint = `/balance?userId=${userId}`;
        // method = "GET";
        break;

      case "get_transactions":
        endpoint = "/transactions";
        requestBody = { userId, limit: params.limit || 50 };
        break;

      case "process_payment":
        endpoint = "/payment";
        requestBody = {
          userId,
          amount: params.amount,
          currency: params.currency,
          recipient: params.recipient,
          description: params.description,
        };
        break;

      case "deposit":
        endpoint = "/deposit";
        requestBody = {
          userId,
          amount: params.amount,
          currency: params.currency,
        };
        break;

      case "withdraw":
        endpoint = "/withdraw";
        requestBody = {
          userId,
          amount: params.amount,
          currency: params.currency,
        };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Call your custom backend
    const apiUrl = `${CUSTOM_WALLET_API_URL}${endpoint}`;
    console.log(`[custom-wallet-proxy] Calling: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        // Add any auth headers your backend needs here
        // "X-API-Key": Deno.env.get("CUSTOM_WALLET_API_KEY") ?? "",
      },
      body: method !== "GET" ? JSON.stringify(requestBody) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[custom-wallet-proxy] Backend error: ${response.status} - ${errorText}`);
      throw new Error(`Backend returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`[custom-wallet-proxy] Success:`, data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[custom-wallet-proxy] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: errorMessage === "Unauthorized" ? 401 : 500,
      }
    );
  }
});
