import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, notional, type, limitPrice, aiRationale, demo } = await req.json();

    // Validate input
    if (!symbol || !notional || notional < 1) {
      return new Response(JSON.stringify({ success: false, message: "Invalid order parameters. Symbol and amount (>= $1) required." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (notional > 100000) {
      return new Response(JSON.stringify({ success: false, message: "Maximum single order is $100,000." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Demo mode — simulate order
    const ALPACA_API_KEY = Deno.env.get("ALPACA_API_KEY");
    const ALPACA_API_SECRET = Deno.env.get("ALPACA_API_SECRET");

    if (!ALPACA_API_KEY || !ALPACA_API_SECRET || demo) {
      const demoOrderId = `demo-${Date.now()}`;
      return new Response(JSON.stringify({
        success: true,
        demo: true,
        message: `[DEMO] Buy order simulated: $${Number(notional).toLocaleString()} of ${symbol.toUpperCase()}. In live mode, this would be executed via Alpaca.`,
        orderId: demoOrderId,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ALPACA_BASE_URL = Deno.env.get("ALPACA_BASE_URL") || "https://paper-api.alpaca.markets";
    const alpacaHeaders = {
      "APCA-API-KEY-ID": ALPACA_API_KEY,
      "APCA-API-SECRET-KEY": ALPACA_API_SECRET,
      "Content-Type": "application/json",
    };

    // Enforce max position size (15% of portfolio)
    try {
      const [accountRes, positionsRes] = await Promise.all([
        fetch(`${ALPACA_BASE_URL}/v2/account`, { headers: alpacaHeaders }),
        fetch(`${ALPACA_BASE_URL}/v2/positions`, { headers: alpacaHeaders }),
      ]);

      if (accountRes.ok && positionsRes.ok) {
        const account = await accountRes.json();
        const positions = await positionsRes.json();
        const totalValue = Number(account.portfolio_value);
        const maxPct = 15;

        const existing = positions.find((p: any) => p.symbol === symbol.toUpperCase());
        const existingValue = existing ? Number(existing.market_value) : 0;
        const newTotal = existingValue + notional;
        const newPct = (newTotal / (totalValue + notional)) * 100;

        if (newPct > maxPct) {
          const maxAllowed = Math.max(0, (maxPct / 100) * totalValue - existingValue);
          return new Response(JSON.stringify({
            success: false,
            message: `Order blocked: this would give ${symbol} a ${newPct.toFixed(1)}% allocation, exceeding the ${maxPct}% position limit. Reduce to $${maxAllowed.toFixed(2)} or less.`,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    } catch {
      // Allow order if portfolio check fails (e.g. empty portfolio)
    }

    // Place buy-only order
    const orderBody: Record<string, unknown> = {
      symbol: symbol.toUpperCase(),
      side: "buy", // HARDCODED — never sell
      type: type || "market",
      time_in_force: "day",
      notional: Number(notional).toFixed(2),
    };

    if (type === "limit" && limitPrice) {
      orderBody.limit_price = Number(limitPrice).toFixed(2);
      delete orderBody.notional;
      orderBody.qty = Math.floor(notional / limitPrice);
    }

    const orderRes = await fetch(`${ALPACA_BASE_URL}/v2/orders`, {
      method: "POST",
      headers: alpacaHeaders,
      body: JSON.stringify(orderBody),
    });

    if (!orderRes.ok) {
      const err = await orderRes.json().catch(() => ({}));
      throw new Error(err.message || `Order failed: ${orderRes.statusText}`);
    }

    const order = await orderRes.json();

    // Log to Supabase audit trail (best effort)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Extract user from auth header
      const authHeader = req.headers.get("authorization");
      if (authHeader) {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
        if (user) {
          await supabase.from("clawbot_trade_log").insert({
            user_id: user.id,
            alpaca_order_id: order.id,
            symbol: order.symbol,
            side: "buy",
            order_type: order.type,
            notional,
            qty: order.qty ? Number(order.qty) : null,
            status: order.status,
            ai_rationale: aiRationale || null,
          });
        }
      }
    } catch (logErr) {
      console.error("Trade log error (non-fatal):", logErr);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Buy order placed: $${Number(notional).toLocaleString()} of ${symbol.toUpperCase()}. Status: ${order.status}.`,
      orderId: order.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("clawbot-invest error:", e);
    return new Response(JSON.stringify({
      success: false,
      message: e instanceof Error ? e.message : "Order failed",
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
