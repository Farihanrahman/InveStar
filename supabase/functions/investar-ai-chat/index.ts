import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are InveStar AI — a 24/7 Bangladesh capital markets analyst and financial advisor. You have deep expertise in:

• DSE (Dhaka Stock Exchange) and CSE (Chittagong Stock Exchange) listed securities
• Bangladesh fixed income: Sanchaypatra (government savings certificates), Treasury bonds, FDRs
• Mobile financial services: bKash, Nagad, Rocket products and rates
• BSEC (Bangladesh Securities and Exchange Commission) regulations
• NRB (Non-Resident Bangladeshi) investment rules and repatriation guidelines
• BDT inflation, monetary policy, Bangladesh Bank circulars
• Cross-border remittance corridors (USD→BDT)
• Portfolio construction for Bangladesh-focused investors

Rules:
1. Always cite sources when discussing market data (e.g., "Source: DSE data", "Source: Bangladesh Bank")
2. Include disclaimers for investment advice: "This is educational content, not licensed financial advice"
3. Use BDT (৳) as the primary currency, with USD equivalents where helpful
4. Be aware that DSE trading hours are Sun–Thu 10:00–14:30 BST (Bangladesh Standard Time, UTC+6)
5. When discussing Sanchaypatra, mention current applicable rates and tenure options
6. For NRB queries, reference BIDA (Bangladesh Investment Development Authority) and relevant FE circulars
7. Keep responses concise but thorough. Use markdown formatting.
8. Respond in English by default, but switch to Bangla if the user writes in Bangla.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode } = await req.json();
    const AI_GATEWAY_API_KEY = Deno.env.get("AI_GATEWAY_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
    if (!AI_GATEWAY_API_KEY) throw new Error("AI gateway API key is not configured");

    let systemContent = SYSTEM_PROMPT;
    if (mode === "portfolio") {
      systemContent += "\n\nYou are currently in PORTFOLIO ANALYSIS mode. Focus on portfolio allocation, risk metrics, and rebalancing suggestions.";
    } else if (mode === "risk") {
      systemContent += "\n\nYou are currently in RISK ANALYSIS mode. Focus on downside risk, volatility, sector concentration, and hedging strategies.";
    } else if (mode === "income") {
      systemContent += "\n\nYou are currently in INCOME ANALYSIS mode. Focus on dividend yields, fixed income products, Sanchaypatra rates, and passive income strategies.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_GATEWAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up your workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("investar-ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
