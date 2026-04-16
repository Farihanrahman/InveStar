import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_DATA = {
  demo: true,
  account: {
    equity: "1000000.00", cash: "1000000.00", portfolio_value: "0.00",
    buying_power: "24680.00", unrealized_pl: "8230.50", unrealized_plpc: "0.0692",
  },
  positions: [
    { symbol: "VTI", qty: "45", avg_entry_price: "220.50", current_price: "232.80", market_value: "10476.00", unrealized_pl: "553.50", unrealized_plpc: "0.0558", asset_class: "us_equity" },
    { symbol: "QQQ", qty: "20", avg_entry_price: "480.00", current_price: "498.25", market_value: "9965.00", unrealized_pl: "365.00", unrealized_plpc: "0.0380", asset_class: "us_equity" },
    { symbol: "VNQ", qty: "60", avg_entry_price: "82.30", current_price: "86.15", market_value: "5169.00", unrealized_pl: "231.00", unrealized_plpc: "0.0468", asset_class: "us_equity" },
    { symbol: "AAPL", qty: "30", avg_entry_price: "178.50", current_price: "192.30", market_value: "5769.00", unrealized_pl: "414.00", unrealized_plpc: "0.0773", asset_class: "us_equity" },
    { symbol: "O", qty: "80", avg_entry_price: "52.40", current_price: "55.80", market_value: "4464.00", unrealized_pl: "272.00", unrealized_plpc: "0.0649", asset_class: "us_equity" },
    { symbol: "BND", qty: "100", avg_entry_price: "72.10", current_price: "73.45", market_value: "7345.00", unrealized_pl: "135.00", unrealized_plpc: "0.0187", asset_class: "us_equity" },
  ],
  orders: [
    { id: "demo-1", symbol: "VTI", qty: "10", notional: null, side: "buy", type: "market", status: "filled", filled_avg_price: "232.80", created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: "demo-2", symbol: "O", qty: "20", notional: null, side: "buy", type: "market", status: "filled", filled_avg_price: "55.80", created_at: new Date(Date.now() - 172800000).toISOString() },
    { id: "demo-3", symbol: "QQQ", qty: "5", notional: null, side: "buy", type: "limit", status: "filled", filled_avg_price: "495.00", created_at: new Date(Date.now() - 259200000).toISOString() },
  ],
};

async function safeJsonParse(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error("Non-JSON response from Alpaca:", text.substring(0, 200));
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ALPACA_API_KEY = Deno.env.get("ALPACA_API_KEY");
    const ALPACA_API_SECRET = Deno.env.get("ALPACA_API_SECRET");
    const ALPACA_BASE_URL = Deno.env.get("ALPACA_BASE_URL") || "https://paper-api.alpaca.markets";

    // Demo mode — return mock data if no Alpaca keys configured
    if (!ALPACA_API_KEY || !ALPACA_API_SECRET) {
      return new Response(JSON.stringify(DEMO_DATA), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const alpacaHeaders = {
      "APCA-API-KEY-ID": ALPACA_API_KEY,
      "APCA-API-SECRET-KEY": ALPACA_API_SECRET,
      "Content-Type": "application/json",
    };

    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint") || "all";

    if (endpoint === "account") {
      const res = await fetch(`${ALPACA_BASE_URL}/v2/account`, { headers: alpacaHeaders });
      const data = await safeJsonParse(res);
      if (!res.ok || !data) return new Response(JSON.stringify(DEMO_DATA), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (endpoint === "positions") {
      const res = await fetch(`${ALPACA_BASE_URL}/v2/positions`, { headers: alpacaHeaders });
      const data = await safeJsonParse(res);
      if (!res.ok || !data) return new Response(JSON.stringify([]), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (endpoint === "orders") {
      const res = await fetch(`${ALPACA_BASE_URL}/v2/orders?limit=20&direction=desc`, { headers: alpacaHeaders });
      const data = await safeJsonParse(res);
      if (!res.ok || !data) return new Response(JSON.stringify([]), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Default: fetch all
    const [accountRes, positionsRes, ordersRes] = await Promise.all([
      fetch(`${ALPACA_BASE_URL}/v2/account`, { headers: alpacaHeaders }),
      fetch(`${ALPACA_BASE_URL}/v2/positions`, { headers: alpacaHeaders }),
      fetch(`${ALPACA_BASE_URL}/v2/orders?limit=20&direction=desc`, { headers: alpacaHeaders }),
    ]);

    const account = await safeJsonParse(accountRes);
    const positions = await safeJsonParse(positionsRes);
    const orders = await safeJsonParse(ordersRes);

    // If Alpaca is unreachable or returning errors, fall back to demo
    if (!account || !accountRes.ok) {
      console.warn("Alpaca API unavailable, falling back to demo data");
      return new Response(JSON.stringify(DEMO_DATA), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ account, positions: positions || [], orders: orders || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("clawbot-portfolio error:", e);
    // Fall back to demo on any error
    return new Response(JSON.stringify(DEMO_DATA), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
