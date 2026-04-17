const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for real-time information about stock prices, market data, financial news, economic indicators, crypto prices, forex rates, IPOs, earnings, or any current event. Use this when the user asks about current prices, recent news, or any time-sensitive financial data.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query — be specific with tickers, market names, or topics" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "scrape_url",
      description: "Scrape a specific URL to extract its content. Use when you need detailed info from a known webpage — financial reports, stock pages, news articles.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The full URL to scrape" },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "place_trade",
      description: "Place a buy order for stocks, ETFs, REITs, or bonds. Use this when the user asks to buy shares or invest money in a specific asset. Only buy orders are supported.",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "The stock/ETF ticker symbol (e.g., AAPL, NVDA, VTI, QQQ)" },
          amount_usd: { type: "number", description: "The dollar amount to invest (notional order)" },
          order_type: { type: "string", enum: ["market", "limit"], description: "Order type - market for immediate, limit for price target" },
          limit_price: { type: "number", description: "Limit price in USD (only for limit orders)" },
          rationale: { type: "string", description: "Brief AI rationale for this trade" },
        },
        required: ["symbol", "amount_usd", "rationale"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_money",
      description: "Initiate a cross-border money transfer/remittance to Bangladesh. Use this when the user asks to send money to someone, make a payment, or transfer funds to a recipient.",
      parameters: {
        type: "object",
        properties: {
          recipient_name: { type: "string", description: "Name of the recipient" },
          amount_usd: { type: "number", description: "Amount in USD to send" },
          method: { type: "string", enum: ["bkash", "nagad", "bank", "usdc"], description: "Payment method (default: bkash)" },
          purpose: { type: "string", enum: ["family_support", "education", "medical", "business", "investment"], description: "Purpose of transfer" },
          note: { type: "string", description: "Optional note for the recipient" },
        },
        required: ["recipient_name", "amount_usd"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_portfolio",
      description: "Fetch the current portfolio data including account balance, positions, and recent orders. Use this when the user asks about their portfolio, holdings, balance, or P&L.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

async function executeTool(toolName: string, args: Record<string, unknown>, demo: boolean): Promise<Record<string, unknown>> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (toolName === "web_search") {
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) return { error: "Web search not configured" };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const resp = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: args.query,
          limit: 5,
          scrapeOptions: { formats: ["markdown"] },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await resp.json();
      if (!resp.ok) return { error: data.error || "Search failed" };
      const results = (data.data || []).map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.description || r.markdown?.substring(0, 500),
      }));
      return { success: true, results };
    } catch (e) {
      clearTimeout(timeout);
      return { error: e instanceof Error ? e.message : "Search timeout" };
    }
  }

  if (toolName === "scrape_url") {
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) return { error: "Scraping not configured" };

    let url = String(args.url || "").trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) url = `https://${url}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await resp.json();
      if (!resp.ok) return { error: data.error || "Scrape failed" };
      const content = data.data?.markdown || data.markdown || "";
      const truncated = content.length > 3000 ? content.substring(0, 3000) + "\n\n[...truncated]" : content;
      return { success: true, title: data.data?.metadata?.title || url, url, content: truncated };
    } catch (e) {
      clearTimeout(timeout);
      return { error: e instanceof Error ? e.message : "Scrape timeout" };
    }
  }

  if (toolName === "place_trade") {
    const res = await fetch(`${supabaseUrl}/functions/v1/clawbot-invest`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
      body: JSON.stringify({
        symbol: args.symbol,
        notional: args.amount_usd,
        type: args.order_type || "market",
        limitPrice: args.limit_price,
        aiRationale: args.rationale,
        demo,
      }),
    });
    return await res.json();
  }

  if (toolName === "send_money") {
    const exchangeRate = 122.78;
    const amountUsd = Number(args.amount_usd);
    const amountBdt = amountUsd * exchangeRate;
    return {
      success: true,
      action: "send_money",
      demo: true,
      message: `[DEMO] Transfer initiated: $${amountUsd.toLocaleString()} → ৳${amountBdt.toLocaleString()} to ${args.recipient_name} via ${args.method || "bkash"}.`,
      details: {
        recipient: args.recipient_name,
        amount_usd: amountUsd,
        amount_bdt: amountBdt,
        exchange_rate: exchangeRate,
        method: args.method || "bkash",
        purpose: args.purpose || "family_support",
        note: args.note || null,
        status: "simulated",
      },
    };
  }

  if (toolName === "check_portfolio") {
    const res = await fetch(`${supabaseUrl}/functions/v1/clawbot-portfolio`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
    });
    return await res.json();
  }

  return { error: `Unknown tool: ${toolName}` };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, demo, settings } = await req.json();
    const AI_GATEWAY_API_KEY = Deno.env.get("AI_GATEWAY_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
    if (!AI_GATEWAY_API_KEY) throw new Error("AI gateway API key is not configured");

    // Fetch live portfolio context
    let portfolioContext = "";
    const ALPACA_API_KEY = Deno.env.get("ALPACA_API_KEY");
    const ALPACA_API_SECRET = Deno.env.get("ALPACA_API_SECRET");
    const ALPACA_BASE_URL = Deno.env.get("ALPACA_BASE_URL") || "https://paper-api.alpaca.markets";

    if (ALPACA_API_KEY && ALPACA_API_SECRET && !demo) {
      try {
        const alpacaHeaders = {
          "APCA-API-KEY-ID": ALPACA_API_KEY,
          "APCA-API-SECRET-KEY": ALPACA_API_SECRET,
        };
        const [accRes, posRes] = await Promise.all([
          fetch(`${ALPACA_BASE_URL}/v2/account`, { headers: alpacaHeaders }),
          fetch(`${ALPACA_BASE_URL}/v2/positions`, { headers: alpacaHeaders }),
        ]);
        if (accRes.ok && posRes.ok) {
          const account = await accRes.json();
          const positions = await posRes.json();
          const posLines = positions.map((p: any) =>
            `  - ${p.symbol}: $${Number(p.market_value).toFixed(2)} (${(Number(p.unrealized_plpc) * 100).toFixed(1)}% P&L, qty ${p.qty})`
          ).join("\n");
          portfolioContext = `
LIVE PORTFOLIO (Alpaca Paper Trading):
- Total equity: $${Number(account.equity).toFixed(2)}
- Cash: $${Number(account.cash).toFixed(2)}
- Portfolio value: $${Number(account.portfolio_value).toFixed(2)}
- Unrealized P&L: $${Number(account.unrealized_pl).toFixed(2)}

Positions:
${posLines || "  No positions yet."}`;
        }
      } catch {
        portfolioContext = "Portfolio data temporarily unavailable.";
      }
    } else {
      portfolioContext = `
DEMO PORTFOLIO (Simulated):
- Total equity: $127,450.00
- Cash: $12,340.00
- Portfolio value: $115,110.00
- Unrealized P&L: +$8,230.50 (+6.9%)

Positions:
  - VTI: $10,476 (+5.6% P&L, 45 shares)
  - QQQ: $9,965 (+3.8% P&L, 20 shares)
  - VNQ: $5,169 (+4.7% P&L, 60 shares)
  - AAPL: $5,769 (+7.7% P&L, 30 shares)
  - O: $4,464 (+6.5% P&L, 80 shares)
  - BND: $7,345 (+1.9% P&L, 100 shares)

NOTE: This is demo data.`;
    }

    // Build settings context
    let settingsContext = "";
    if (settings) {
      settingsContext = `
USER INVESTMENT PREFERENCES:
- Investing Style: ${settings.investingStyle || "growth"}
- Risk Tolerance: ${settings.riskLevel || "moderate-high"}
- Time Horizon: ${settings.timeHorizon || "10+ years"}
- Target Allocation: Stocks ${settings.stockPct || 65}% | REITs ${settings.reitPct || 25}% | Bonds ${settings.bondPct || 10}%
- DCA: ${settings.dcaEnabled ? `$${settings.dcaAmount || 500} ${settings.dcaFrequency || "monthly"}` : "Disabled"}
- Max Position Size: ${settings.maxPositionPct || 15}%
- Buy on Dip: ${settings.buyOnDip ? "Yes" : "No"}
- Dividend Focus: ${settings.dividendFocus ? "Yes" : "No"}
- ESG Filter: ${settings.esgFilter ? "Yes" : "No"}

When making trade suggestions or placing orders, respect these preferences. Align recommendations with the user's risk tolerance, investing style, and allocation targets.`;
    }

    const systemPrompt = `You are the InveStar Agent, an autonomous AI investment copilot with CFA charterholder-level expertise. You can EXECUTE actions AND search the web for real-time data. You combine:
- Institutional equity research (DCF, comparable analysis, factor investing)
- Real estate investment analysis (cap rates, NOI, REITs, direct property)
- Portfolio construction (MPT, efficient frontier, risk-adjusted returns)
- Cross-border payments and remittance (USD → BDT via bKash, Nagad, bank)
- Macro awareness (Fed policy, rates, sector rotation)
- Real-time web search for current market data, news, and prices

${portfolioContext}
${settingsContext}

CAPABILITIES — You can take ACTION:
1. **Web search**: Search for current stock prices, market news, economic data. ALWAYS use web_search when asked about current prices or recent events.
2. **Scrape URL**: Get detailed content from a specific webpage.
3. **Place trades**: When user says "Buy 100 Apple shares" or "Invest $500 in NVDA", use the place_trade tool.
4. **Send money**: When user says "Send $100 to my friend Ahmed" or "Transfer $200 to Bangladesh", use the send_money tool.
5. **Check portfolio**: When user asks about their holdings or balance, use the check_portfolio tool.

CRITICAL RULES:
1. When the user asks about current prices, market conditions, or recent news — ALWAYS use web_search first to get real-time data. Never guess prices.
2. When the user clearly requests a trade or payment, USE THE TOOL immediately.
3. For trades: You ONLY place buy orders. Never recommend sells.
4. For amounts: If user says "100 shares of AAPL", estimate the notional value using web_search to get the current price.
5. Respect max position size limits (default 15%).
6. Be concise but substantive — 2-4 sentences for confirmations, longer for analysis.
7. When confirming an action, explain what you did and why.
8. Today's date is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.
9. Add disclaimer: "This is educational content, not licensed financial advice."
10. For send_money: Always ask for the recipient name if not provided. Default method is bkash.
11. When user says "Buy X shares of Y", use web_search to find current price, then calculate: amount_usd = shares × current_price.
12. Cite sources with URLs when you use web search data.`;

    // Agentic loop — up to 3 tool-calling iterations
    const MAX_ITERATIONS = 3;
    let currentMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];
    let allActionResults: any[] = [];

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AI_GATEWAY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: currentMessages,
          tools: TOOLS,
          tool_choice: "auto",
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errText = await response.text();
        throw new Error(`AI gateway error: ${status} - ${errText}`);
      }

      const result = await response.json();
      const choice = result.choices?.[0];
      if (!choice) break;

      if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
        currentMessages.push(choice.message);

        for (const toolCall of choice.message.tool_calls) {
          const fnName = toolCall.function.name;
          let fnArgs: Record<string, unknown> = {};
          try { fnArgs = JSON.parse(toolCall.function.arguments); } catch { fnArgs = {}; }

          console.log(`[iter ${i}] Executing tool: ${fnName}`, fnArgs);
          const toolResult = await executeTool(fnName, fnArgs, !!demo);
          console.log(`[iter ${i}] Tool result:`, JSON.stringify(toolResult).substring(0, 300));

          currentMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          });

          // Only include actionable tools in the UI
          if (fnName === "place_trade" || fnName === "send_money") {
            allActionResults.push({
              tool: fnName,
              args: fnArgs,
              result: toolResult,
            });
          }
        }
        continue; // let the AI decide if more tools needed
      }

      // No more tool calls — break to stream final response
      break;
    }

    // Stream the final response
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_GATEWAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: currentMessages,
        stream: true,
      }),
    });

    if (!streamResponse.ok) throw new Error(`Stream call failed: ${streamResponse.status}`);

    // Prepend action metadata if any
    if (allActionResults.length > 0) {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      writer.write(encoder.encode(`data: ${JSON.stringify({ type: "actions", actions: allActionResults })}\n\n`));

      const reader = streamResponse.body!.getReader();
      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            await writer.write(value);
          }
        } finally {
          writer.close();
        }
      })();

      return new Response(readable, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    return new Response(streamResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("clawbot-advisor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
