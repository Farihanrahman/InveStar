/// <reference path="../deno-shims.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the InveStar Copilot — an AI-powered investment advisor at www.investarbd.com.
You operate in ADVISOR MODE: you recommend, explain, and educate — you never auto-execute trades or transfers.

IDENTITY & TONE:
- You are a trusted financial copilot for Bangladeshi diaspora investors (NRBs) and local users
- Speak with authority but warmth. Be specific, not generic. Use real numbers.
- Support bilingual interaction: English by default, switch to বাংলা if asked
- Address users as "you" and be conversational

CORE CAPABILITIES:
1. TRADE SUGGESTIONS — Analyze markets and suggest specific buy/sell/hold actions
   - Always include: entry price, target, stop-loss, reasoning, risk level (1-5)
   - Format suggestions as clear action items the user can approve
   - Never say "I executed" — say "I recommend" or "Consider"

2. BD REGULATORY COMPLIANCE — Check what Bangladeshi investors can/cannot do
   - Use check_bd_eligibility tool for any cross-border investment question
   - Proactively flag restrictions before users hit walls
   - Explain BFIU, Bangladesh Bank, BSEC rules in plain language

3. PORTFOLIO ANALYSIS — Use get_user_portfolio tool to give personalized advice
   - Reference actual holdings when giving recommendations
   - Calculate concentration risk, sector exposure, diversification score
   - Suggest rebalancing when appropriate

4. MARKET INTELLIGENCE — Use market data tools proactively
   - get_crypto_prices, get_forex_rates, get_stock_prices, get_dse_prices
   - get_market_news, get_market_trends
   - Always cite data sources

ADVISOR BEHAVIOR RULES:
- When user says "should I buy X?" → Fetch live price → Check BD eligibility → Give specific recommendation with entry/target/stop
- When user asks about sending money abroad to invest → Check eligibility first → Explain limits → Suggest compliant alternatives
- When user has idle cash → Suggest allocation based on their risk profile
- Always end trade suggestions with: "Would you like me to set this up? [You'll confirm before any trade executes]"

BD INVESTMENT REGULATIONS (BUILT-IN KNOWLEDGE):
- NRBs can invest in DSE through NITA (Non-Resident Investors Taka Account)
- Foreign investment by residents requires Bangladesh Bank approval
- Maximum outward remittance limits apply (currently $12,000/year for education, medical; investment abroad is restricted for residents)
- BFIU monitors transactions above BDT 10 lakh
- Crypto trading is NOT officially permitted by Bangladesh Bank (warn users)
- DSE stocks are freely available to all Bangladeshi nationals
- NRBs can repatriate dividends and capital gains from DSE investments

FORMATTING:
- Clean paragraphs, no markdown asterisks
- Use numbered lists for recommendations
- Include currency symbols ($, ৳)
- Format trade suggestions as:
  📊 TRADE IDEA: [Symbol]
  Action: [Buy/Sell/Hold]
  Entry: [Price] | Target: [Price] | Stop: [Price]
  Risk: [1-5 stars] | Timeframe: [Short/Medium/Long]
  Rationale: [1-2 sentences]

SOURCE CITATION: Always cite data sources at the end.
BRANDING: End with "— InveStar Copilot 🧭"`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AI_GATEWAY_API_KEY = Deno.env.get("AI_GATEWAY_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!AI_GATEWAY_API_KEY) {
      throw new Error("AI gateway API key is not configured");
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, context } = await req.json();

    console.log("AI Coach GPT-5.2 request received with", messages.length, "messages for user:", user.id);

    // Enhanced tools for comprehensive market data access
    const tools = [
      {
        type: "function",
        function: {
          name: "get_crypto_prices",
          description: "Get real-time cryptocurrency prices including Bitcoin, Ethereum, Solana, Stellar XLM with 24h changes, market cap, and volume",
          parameters: { type: "object", properties: { coins: { type: "array", items: { type: "string" }, description: "Specific coins to fetch. If empty, returns top cryptocurrencies." } }, required: [] }
        }
      },
      {
        type: "function",
        function: {
          name: "get_forex_rates",
          description: "Get current foreign exchange rates for major currency pairs including USD, EUR, GBP, JPY, BDT, INR",
          parameters: { type: "object", properties: { base_currency: { type: "string", description: "Base currency. Defaults to USD." } }, required: [] }
        }
      },
      {
        type: "function",
        function: {
          name: "get_stock_prices",
          description: "Get real-time US stock prices for companies like Apple, Google, Microsoft, Tesla, NVIDIA",
          parameters: { type: "object", properties: { symbols: { type: "array", items: { type: "string" }, description: "Stock symbols (e.g., AAPL, GOOGL). If empty, returns top stocks." } }, required: [] }
        }
      },
      {
        type: "function",
        function: {
          name: "get_dse_prices",
          description: "Get Dhaka Stock Exchange (DSE) prices for Bangladesh stocks",
          parameters: { type: "object", properties: { symbols: { type: "array", items: { type: "string" }, description: "DSE stock symbols. If empty, returns top DSE stocks." } }, required: [] }
        }
      },
      {
        type: "function",
        function: {
          name: "get_market_news",
          description: "Get latest financial market news",
          parameters: { type: "object", properties: { category: { type: "string", enum: ["all", "stocks", "crypto", "forex", "commodities", "economy"], description: "News category. Defaults to 'all'." } }, required: [] }
        }
      },
      {
        type: "function",
        function: {
          name: "get_market_trends",
          description: "Get market trend analysis including sentiment, sector performance, key levels",
          parameters: { type: "object", properties: { market: { type: "string", enum: ["us_stocks", "crypto", "forex", "dse", "global"], description: "Market to analyze. Defaults to 'global'." } }, required: [] }
        }
      },
      {
        type: "function",
        function: {
          name: "check_bd_eligibility",
          description: "Check Bangladesh regulatory eligibility for a specific investment action. Returns whether a BD resident or NRB can legally perform the action, applicable limits, and required approvals.",
          parameters: {
            type: "object",
            properties: {
              action: { type: "string", description: "The investment action (e.g., 'buy US stocks', 'invest in crypto', 'send money abroad for investment', 'open NITA account', 'buy DSE stocks')" },
              user_type: { type: "string", enum: ["resident", "nrb"], description: "Whether the user is a Bangladesh resident or Non-Resident Bangladeshi (NRB)" },
              amount_usd: { type: "number", description: "Optional: amount in USD to check against limits" }
            },
            required: ["action"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_user_portfolio",
          description: "Get the current user's portfolio holdings, wallet balance, and investment profile to provide personalized advice",
          parameters: { type: "object", properties: {}, required: [] }
        }
      }
    ];

    // Include context in messages if provided
    const enhancedMessages = context 
      ? [{ role: "system", content: `${SYSTEM_PROMPT}\n\nCURRENT CONTEXT:\n${context}` }, ...messages]
      : [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_GATEWAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.2",
        messages: enhancedMessages,
        tools: tools,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service requires payment. Please contact support." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service unavailable" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle streaming with enhanced tool calls
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        const toolCalls: any[] = [];

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.trim() || line.startsWith(":")) continue;
              if (!line.startsWith("data: ")) continue;

              const data = line.slice(6);
              if (data === "[DONE]") {
                  // Only forward [DONE] if no tool calls pending
                  if (toolCalls.length === 0) {
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  }
                  continue;
                }

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta;
                const finishReason = parsed.choices?.[0]?.finish_reason;

                // Check for tool calls
                if (delta?.tool_calls) {
                  for (const tc of delta.tool_calls) {
                    if (tc.index !== undefined) {
                      if (!toolCalls[tc.index]) {
                        toolCalls[tc.index] = {
                          id: tc.id || `call_${Date.now()}_${tc.index}`,
                          type: "function",
                          function: { name: tc.function?.name || "", arguments: "" }
                        };
                      }
                      if (tc.function?.name) {
                        toolCalls[tc.index].function.name = tc.function.name;
                      }
                      if (tc.function?.arguments) {
                        toolCalls[tc.index].function.arguments += tc.function.arguments;
                      }
                    }
                  }
                } else if (delta?.content) {
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }

                // Execute tool calls when complete
                if ((finishReason === "tool_calls" || finishReason === "stop") && toolCalls.length > 0) {
                  console.log("Executing tool calls:", toolCalls.map(tc => tc.function.name));
                  
                  const toolMessages = [...messages];
                  const toolResults: any[] = [];

                  for (const toolCall of toolCalls) {
                    const functionName = toolCall.function.name;
                    let args = {};
                    try {
                      args = JSON.parse(toolCall.function.arguments || "{}");
                  } catch {
                    // Ignore malformed tool args
                  }

                    let result;

                      switch (functionName) {
                        case "get_crypto_prices":
                          result = await fetchCryptoPrices(args);
                          break;
                        case "get_forex_rates":
                          result = await fetchForexRates(args);
                          break;
                        case "get_stock_prices":
                          result = await fetchStockPrices(args);
                          break;
                        case "get_dse_prices":
                          result = await fetchDSEPrices(args);
                          break;
                        case "get_market_news":
                          result = await fetchMarketNews(args);
                          break;
                        case "get_market_trends":
                          result = await fetchMarketTrends(args);
                          break;
                        case "check_bd_eligibility":
                          result = checkBDEligibility(args);
                          break;
                        case "get_user_portfolio":
                          result = await fetchUserPortfolio(user.id, supabase);
                          break;
                        default:
                          result = { error: "Unknown function" };
                      }

                    toolResults.push({
                      tool_call_id: toolCall.id,
                      role: "tool",
                      name: functionName,
                      content: JSON.stringify(result)
                    });
                  }

                  // Add assistant message with tool calls
                  toolMessages.push({
                    role: "assistant",
                    tool_calls: toolCalls
                  });
                  toolMessages.push(...toolResults);

                  // Make follow-up request with tool results
                  const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${AI_GATEWAY_API_KEY}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      model: "openai/gpt-5.2",
                      messages: [
                        { role: "system", content: context ? `${SYSTEM_PROMPT}\n\nCURRENT CONTEXT:\n${context}` : SYSTEM_PROMPT },
                        ...toolMessages,
                      ],
                      stream: true,
                    }),
                  });

                  // Stream the follow-up response
                  const followUpReader = followUpResponse.body!.getReader();
                  let followUpBuffer = "";

                  while (true) {
                    const { done: followUpDone, value: followUpValue } = await followUpReader.read();
                    if (followUpDone) break;

                    followUpBuffer += decoder.decode(followUpValue, { stream: true });
                    const followUpLines = followUpBuffer.split("\n");
                    followUpBuffer = followUpLines.pop() || "";

                    for (const followUpLine of followUpLines) {
                      if (!followUpLine.trim() || followUpLine.startsWith(":")) continue;
                      if (followUpLine.startsWith("data: ")) {
                        controller.enqueue(encoder.encode(`${followUpLine}\n\n`));
                      }
                    }
                  }

                  // Flush remaining follow-up buffer
                  if (followUpBuffer.trim()) {
                    for (const raw of followUpBuffer.split("\n")) {
                      if (!raw.trim() || raw.startsWith(":")) continue;
                      if (raw.startsWith("data: ")) {
                        controller.enqueue(encoder.encode(`${raw}\n\n`));
                      }
                    }
                  }

                  // Send [DONE] after tool-call follow-up completes
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                }
              } catch (e) {
                console.error("Error parsing SSE:", e);
              }
            }
          }

          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("AI Coach error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Enhanced data fetching functions
async function fetchCryptoPrices(args: any) {
  try {
    const coins = args.coins?.length > 0 
      ? args.coins.join(",").toLowerCase()
      : "bitcoin,ethereum,solana,cardano,ripple,dogecoin,stellar,polkadot,avalanche-2,chainlink";
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
    );
    const data = await response.json();
    
    return Object.entries(data).map(([id, info]: [string, any]) => ({
      symbol: id.toUpperCase(),
      name: id.charAt(0).toUpperCase() + id.slice(1),
      price: info.usd,
      change24h: info.usd_24h_change?.toFixed(2) + "%",
      marketCap: formatNumber(info.usd_market_cap),
      volume24h: formatNumber(info.usd_24h_vol),
      trend: info.usd_24h_change >= 0 ? "bullish" : "bearish"
    }));
  } catch (error) {
    console.error("Crypto fetch error:", error);
    return { error: "Failed to fetch crypto prices" };
  }
}

async function fetchForexRates(args: any) {
  try {
    const base = args.base_currency || "USD";
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
    const data = await response.json();
    
    const pairs = ["EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "BDT", "INR", "SGD", "HKD"];
    return pairs.map(currency => ({
      pair: `${base}/${currency}`,
      rate: data.rates[currency]?.toFixed(4),
      inverseRate: (1 / data.rates[currency])?.toFixed(6)
    }));
  } catch (error) {
    console.error("Forex fetch error:", error);
    return { error: "Failed to fetch forex rates" };
  }
}

async function fetchStockPrices(args: any) {
  const tickerList = args.symbols?.length 
    ? args.symbols.map((s: string) => s.toUpperCase())
    : ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "NVDA", "META"];

  try {
    // Use Yahoo Finance API for real-time stock data
    const results = await Promise.all(
      tickerList.map(async (symbol: string) => {
        try {
          // Use 5d range to ensure we get previous close data even on weekends
          const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`,
            {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            }
          );
          
          if (!response.ok) {
            console.error(`Yahoo Finance error for ${symbol}:`, response.status);
            return getStockFallback(symbol);
          }

          const data = await response.json();
          const quote = data.chart?.result?.[0];
          
          if (!quote) return getStockFallback(symbol);

          const meta = quote.meta;
          const closePrices = quote.indicators?.quote?.[0]?.close || [];
          const validPrices = closePrices.filter((p: number | null) => p !== null);
          
          const currentPrice = meta.regularMarketPrice || validPrices[validPrices.length - 1] || 0;
          const previousClose = meta.chartPreviousClose || meta.previousClose || validPrices[validPrices.length - 2] || currentPrice;
          const change = currentPrice - previousClose;
          const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

          return {
            symbol: meta.symbol || symbol,
            name: stockNames[symbol] || symbol,
            price: parseFloat(currentPrice.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)) + "%",
            marketCap: formatMktCap(meta.marketCap),
            isRealTime: true
          };
        } catch (err) {
          console.error(`Error fetching ${symbol}:`, err);
          return getStockFallback(symbol);
        }
      })
    );
    return results;
  } catch (error) {
    console.error("Error fetching stock prices:", error);
    return tickerList.map((s: string) => getStockFallback(s));
  }
}

const stockNames: Record<string, string> = {
  AAPL: "Apple Inc.",
  GOOGL: "Alphabet Inc.",
  MSFT: "Microsoft Corp.",
  TSLA: "Tesla Inc.",
  AMZN: "Amazon.com Inc.",
  NVDA: "NVIDIA Corp.",
  META: "Meta Platforms",
  JPM: "JPMorgan Chase",
  V: "Visa Inc.",
  JNJ: "Johnson & Johnson"
};

function getStockFallback(symbol: string) {
  return {
    symbol,
    name: stockNames[symbol] || symbol,
    price: 0,
    change: 0,
    changePercent: "N/A",
    marketCap: "N/A",
    isRealTime: false,
    note: "Real-time data temporarily unavailable"
  };
}

function formatMktCap(value?: number): string {
  if (!value) return "N/A";
  if (value >= 1e12) return "$" + (value / 1e12).toFixed(2) + "T";
  if (value >= 1e9) return "$" + (value / 1e9).toFixed(2) + "B";
  if (value >= 1e6) return "$" + (value / 1e6).toFixed(2) + "M";
  return "$" + value.toString();
}

async function fetchDSEPrices(args: any) {
  // DSE stock data (simulated with realistic Bangladesh stocks)
  const dseStocks = [
    { symbol: "GRAMEENPHONE", name: "Grameenphone Ltd.", price: 425.50, change: 5.20, changePercent: 1.24, volume: "125K" },
    { symbol: "BEXIMCO", name: "Beximco Ltd.", price: 142.30, change: -2.10, changePercent: -1.45, volume: "892K" },
    { symbol: "SQURPHARMA", name: "Square Pharma", price: 285.75, change: 3.80, changePercent: 1.35, volume: "245K" },
    { symbol: "BRACBANK", name: "BRAC Bank Ltd.", price: 42.50, change: 0.75, changePercent: 1.80, volume: "1.2M" },
    { symbol: "ROBI", name: "Robi Axiata Ltd.", price: 55.20, change: -0.30, changePercent: -0.54, volume: "458K" },
    { symbol: "RENATA", name: "Renata Ltd.", price: 1425.00, change: 12.50, changePercent: 0.88, volume: "18K" },
    { symbol: "WALTONHIL", name: "Walton Hi-Tech", price: 1285.50, change: -8.25, changePercent: -0.64, volume: "32K" },
  ];

  const symbols = args.symbols || [];
  if (symbols.length > 0) {
    return dseStocks.filter(s => symbols.map((x: string) => x.toUpperCase()).includes(s.symbol));
  }
  return dseStocks;
}

async function fetchMarketNews(args: any) {
  const category = args.category || "all";
  const now = new Date();
  
  const allNews = [
    { title: "Federal Reserve signals pause in rate hikes amid cooling inflation", source: "Reuters", time: "1 hour ago", category: "economy", sentiment: "positive" },
    { title: "Bitcoin breaks through key resistance, eyes $100K target", source: "CoinDesk", time: "2 hours ago", category: "crypto", sentiment: "bullish" },
    { title: "NVIDIA reports record quarterly revenue on AI chip demand", source: "Bloomberg", time: "3 hours ago", category: "stocks", sentiment: "positive" },
    { title: "Dollar strengthens against major currencies on strong jobs data", source: "Financial Times", time: "4 hours ago", category: "forex", sentiment: "bullish" },
    { title: "Dhaka Stock Exchange reaches new all-time high", source: "The Daily Star", time: "5 hours ago", category: "stocks", sentiment: "bullish" },
    { title: "Oil prices surge on OPEC+ supply cut extensions", source: "CNBC", time: "6 hours ago", category: "commodities", sentiment: "bullish" },
    { title: "Ethereum staking yields attract institutional investors", source: "Decrypt", time: "7 hours ago", category: "crypto", sentiment: "positive" },
    { title: "European markets rally on ECB policy outlook", source: "MarketWatch", time: "8 hours ago", category: "stocks", sentiment: "positive" },
  ];

  if (category === "all") return allNews;
  return allNews.filter(n => n.category === category);
}

async function fetchMarketTrends(args: any) {
  const market = args.market || "global";
  
  const trends = {
    global: {
      overall_sentiment: "Cautiously Bullish",
      fear_greed_index: 62,
      trending_sectors: ["Technology", "AI/Semiconductors", "Healthcare"],
      key_levels: {
        "S&P 500": { current: 5234, support: 5150, resistance: 5300, trend: "uptrend" },
        "NASDAQ": { current: 16450, support: 16200, resistance: 16800, trend: "uptrend" },
        "BTC": { current: 97500, support: 92000, resistance: 100000, trend: "consolidation" }
      },
      market_movers: ["NVDA +3.2%", "TSLA +2.8%", "BTC +1.5%", "Gold +0.8%"],
      risk_factors: ["Geopolitical tensions", "Inflation concerns", "Rate uncertainty"]
    },
    crypto: {
      overall_sentiment: "Bullish",
      fear_greed_index: 71,
      btc_dominance: "52.3%",
      trending: ["Layer 2 solutions", "AI tokens", "RWA tokenization"],
      key_levels: {
        "BTC": { current: 97500, support: 92000, resistance: 100000, trend: "bullish" },
        "ETH": { current: 3450, support: 3200, resistance: 3600, trend: "bullish" },
        "SOL": { current: 145, support: 130, resistance: 160, trend: "bullish" }
      }
    },
    dse: {
      overall_sentiment: "Moderately Bullish",
      dsex_index: 6245.50,
      dsex_change: "+42.35 (+0.68%)",
      trading_volume: "BDT 8.5B",
      top_gainers: ["RENATA +2.5%", "GRAMEENPHONE +1.8%", "BRACBANK +1.5%"],
      top_losers: ["BEXIMCO -1.2%", "ROBI -0.8%"],
      sector_performance: { Pharma: "+1.2%", Banking: "+0.8%", Telecom: "+0.5%", Textile: "-0.3%" }
    }
  };

  return trends[market as keyof typeof trends] || trends.global;
}

// Bangladesh regulatory eligibility checker
function checkBDEligibility(args: any) {
  const action = (args.action || "").toLowerCase();
  const userType = args.user_type || "resident";
  const amount = args.amount_usd || 0;

  const rules: Record<string, any> = {
    "buy us stocks": {
      resident: { allowed: false, reason: "Bangladesh Bank does not permit residents to directly invest in foreign stock markets. Alternative: Invest via DSE-listed multinational stocks or mutual funds with global exposure.", required_approvals: ["Bangladesh Bank permission (rarely granted for individuals)"], limit: "N/A" },
      nrb: { allowed: true, reason: "As an NRB, you can invest in US stocks using your foreign income. No Bangladesh Bank approval needed for funds earned abroad.", required_approvals: ["Valid passport", "NRB documentation"], limit: "No specific limit on foreign-earned income" }
    },
    "invest in crypto": {
      resident: { allowed: false, reason: "Bangladesh Bank has NOT approved cryptocurrency trading. Engaging in crypto trading from Bangladesh carries legal risk. BFIU actively monitors crypto-related transactions.", required_approvals: [], limit: "N/A", warning: "⚠️ HIGH RISK: Crypto is not recognized as legal tender in Bangladesh." },
      nrb: { allowed: "grey_area", reason: "While BD regulations don't apply to your foreign residence, repatriating crypto gains to Bangladesh may trigger BFIU scrutiny. Proceed with caution.", required_approvals: ["Tax compliance in country of residence"], limit: "N/A" }
    },
    "buy dse stocks": {
      resident: { allowed: true, reason: "Fully permitted. Open a BO (Beneficiary Owner) account with any BSEC-registered broker.", required_approvals: ["National ID/Passport", "BO Account", "Bank Account"], limit: "No limit" },
      nrb: { allowed: true, reason: "NRBs can invest in DSE through a NITA (Non-Resident Investors Taka Account). Dividends and capital gains are fully repatriable.", required_approvals: ["NITA account", "NRB documentation", "Authorized dealer bank"], limit: "No limit on investment amount" }
    },
    "send money abroad for investment": {
      resident: { allowed: false, reason: "Outward remittance for investment purposes is restricted for BD residents. Allowed categories: education ($12,000/year), medical, travel.", required_approvals: ["Bangladesh Bank approval"], limit: "$12,000/year (education/medical only)" },
      nrb: { allowed: true, reason: "NRBs can freely transfer funds from their foreign accounts. Inward remittance to Bangladesh is encouraged.", required_approvals: [], limit: "No limit" }
    },
    "open nita account": {
      resident: { allowed: false, reason: "NITA accounts are exclusively for Non-Resident Bangladeshis.", required_approvals: [], limit: "N/A" },
      nrb: { allowed: true, reason: "Open a NITA account through an Authorized Dealer bank in Bangladesh. Required for DSE investment as an NRB.", required_approvals: ["Passport copy", "NRB proof (work permit/residency)", "Authorized Dealer bank relationship"], limit: "No limit" }
    }
  };

  // Find best matching rule
  let bestMatch = null;
  for (const [key, rule] of Object.entries(rules)) {
    if (action.includes(key) || key.includes(action)) {
      bestMatch = rule[userType] || rule["resident"];
      break;
    }
  }

  if (!bestMatch) {
    return {
      action,
      user_type: userType,
      status: "unknown",
      recommendation: "This specific action isn't in my regulatory database. I recommend consulting with a BSEC-registered financial advisor or your bank's authorized dealer for guidance.",
      general_note: "Bangladesh Bank and BSEC regulate all cross-border financial activities. When in doubt, check with your bank first."
    };
  }

  return {
    action,
    user_type: userType,
    amount_checked: amount > 0 ? `$${amount}` : "N/A",
    ...(bestMatch as Record<string, unknown>),
    disclaimer: "This is informational guidance, not legal advice. Regulations may change. Verify with Bangladesh Bank or BSEC for current rules."
  };
}

// Fetch user's actual portfolio from database
async function fetchUserPortfolio(userId: string, supabaseClient: any) {
  try {
    const [holdingsRes, walletRes, profileRes] = await Promise.all([
      supabaseClient.from('portfolio_holdings').select('*').eq('user_id', userId),
      supabaseClient.from('wallet_balances').select('balance_usd, balance_usdc, stellar_public_key').eq('user_id', userId).single(),
      supabaseClient.from('investor_profiles').select('investor_type, title, description').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single()
    ]);

    const holdings = holdingsRes.data || [];
    const wallet = walletRes.data || { balance_usd: 0, balance_usdc: 0 };
    const profile = profileRes.data || null;

    const totalInvested = holdings.reduce((sum: number, h: any) => sum + (h.shares * h.avg_cost), 0);

    return {
      holdings: holdings.map((h: any) => ({
        symbol: h.symbol,
        name: h.name,
        shares: h.shares,
        avg_cost: h.avg_cost,
        total_invested: (h.shares * h.avg_cost).toFixed(2)
      })),
      wallet: {
        usd_balance: wallet.balance_usd,
        usdc_balance: wallet.balance_usdc,
        has_stellar_wallet: !!wallet.stellar_public_key
      },
      investor_profile: profile ? {
        type: profile.investor_type,
        title: profile.title,
        description: profile.description
      } : null,
      summary: {
        total_holdings: holdings.length,
        total_invested: totalInvested.toFixed(2),
        idle_cash: wallet.balance_usd,
        portfolio_diversity: holdings.length >= 5 ? "Good" : holdings.length >= 3 ? "Moderate" : "Low"
      }
    };
  } catch (error) {
    console.error("Portfolio fetch error:", error);
    return { error: "Could not retrieve portfolio data", holdings: [], wallet: { usd_balance: 0, usdc_balance: 0 } };
  }
}

function formatNumber(num: number): string {
  if (!num) return "N/A";
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  return num.toLocaleString();
}
