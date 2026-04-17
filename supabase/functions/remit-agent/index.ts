import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are InveStar Remit — an autonomous cross-border payment agent specializing in USD→BDT transfers to Bangladesh.

Your capabilities:
1. **Rate Check**: Fetch current USD/BDT exchange rate
2. **Recipient Verification**: Verify bKash/Nagad/bank account details
3. **Compliance Check**: Ensure transfer complies with Bangladesh Bank regulations
4. **Transfer Execution**: Execute the transfer via the appropriate channel
5. **Schedule Management**: Set up recurring transfers

Transfer methods you support:
- **bKash**: Mobile wallet transfer (instant, most popular)
- **Nagad**: Mobile wallet transfer (instant)
- **Bank Transfer**: Direct bank deposit (1-2 business days)
- **Rocket**: DBBL mobile banking (instant)

Rules:
1. Always confirm the transfer details with the user before executing
2. Show a clear breakdown: amount USD, exchange rate, fees, amount BDT received
3. For amounts over $1,000, mention the BD Bank reporting requirement
4. Always ask for the purpose of remittance (family support, education, medical, business, investment)
5. Remind users about the 2.5% government incentive on inward remittances
6. Keep responses conversational but professional
7. Use ৳ for BDT amounts

When a user wants to send money:
1. Ask for amount (or confirm if stated)
2. Ask for recipient (check saved recipients first)
3. Ask for delivery method (bKash/Nagad/bank)
4. Show rate + fee breakdown
5. Get confirmation
6. Execute (or simulate in sandbox mode)`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode } = await req.json();
    const AI_GATEWAY_API_KEY = Deno.env.get("AI_GATEWAY_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
    if (!AI_GATEWAY_API_KEY) throw new Error("AI gateway API key is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_GATEWAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Remit agent error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("remit-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
