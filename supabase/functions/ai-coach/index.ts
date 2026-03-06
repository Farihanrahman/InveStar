import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert investment coach from InveStar (www.investarbd.com), powered by GPT-5.2 with access to real-time market data.

CRITICAL: REAL-TIME MARKET DATA ACCESS
You have powerful tools to fetch live market data. USE THEM PROACTIVELY when users ask about:
- Cryptocurrency prices → get_crypto_prices
- Forex/currency rates → get_forex_rates  
- Stock prices (US stocks) → get_stock_prices
- Dhaka Stock Exchange → get_dse_prices
- Market news → get_market_news
- Market trends/analysis → get_market_trends

ALWAYS USE TOOLS when discussing:
- Current prices of any asset
- Market conditions or trends
- Price comparisons
- Investment timing
- Market news or updates

HOW TO RESPOND WITH DATA:
1. Call the appropriate tool(s) to get live data
2. Present prices clearly with symbols and % changes
3. Add expert analysis and actionable insights
4. Compare to historical context when relevant
5. Give specific recommendations with price levels

EXPERT ANALYSIS CAPABILITIES:
- Technical Analysis: Support/resistance levels, trend analysis, momentum indicators
- Fundamental Analysis: Valuation metrics, earnings outlook, sector comparisons
- Risk Assessment: Volatility analysis, correlation insights, portfolio impact
- Timing Insights: Entry/exit recommendations, market sentiment

FORMATTING RULES:
- Write in clean paragraphs without markdown asterisks
- Use numbered lists for clear recommendations
- Always include currency symbols ($, ৳, etc.)
- Format percentages with + or - prefix
- Keep responses actionable and specific

SOURCE CITATION (CRITICAL):
When you use tool data, ALWAYS cite the data source at the end:
- Crypto prices: "Source: CoinGecko (real-time)"
- Forex rates: "Source: ExchangeRate-API (real-time)"  
- US Stock prices: "Source: Yahoo Finance (real-time)"
- DSE prices: "Source: DSE simulated data"
- Market news: "Source: Curated financial news"
- Market trends: "Source: Market analysis data"
Always include a "Data Sources" section at the end of responses that use market data.

LANGUAGE SUPPORT:
- Ask: "Would you like me to explain in Bangla (বাংলা)?"
- If requested, provide full answer in Bengali

BRANDING:
End responses with: "For more insights, visit InveStar at www.investarbd.com!"`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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
          description: "Get real-time cryptocurrency prices including Bitcoin, Ethereum, Solana, Cardano, Ripple, Dogecoin, Stellar XLM with 24h changes, market cap, and volume",
          parameters: {
            type: "object",
            properties: {
              coins: {
                type: "array",
                items: { type: "string" },
                description: "Optional specific coins to fetch. If empty, returns top cryptocurrencies."
              }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_forex_rates",
          description: "Get current foreign exchange rates for major currency pairs including USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, BDT, INR",
          parameters: {
            type: "object",
            properties: {
              base_currency: {
                type: "string",
                description: "Base currency for rates. Defaults to USD."
              }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_stock_prices",
          description: "Get real-time US stock prices for major companies like Apple, Google, Microsoft, Tesla, Amazon, Meta, Nvidia with price changes and key metrics",
          parameters: {
            type: "object",
            properties: {
              symbols: {
                type: "array",
                items: { type: "string" },
                description: "Stock symbols to fetch (e.g., AAPL, GOOGL, MSFT). If empty, returns top stocks."
              }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_dse_prices",
          description: "Get Dhaka Stock Exchange (DSE) prices for Bangladesh stocks with current prices, changes, and trading volume",
          parameters: {
            type: "object",
            properties: {
              symbols: {
                type: "array",
                items: { type: "string" },
                description: "DSE stock symbols to fetch. If empty, returns top DSE stocks."
              }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_market_news",
          description: "Get latest financial market news covering stocks, crypto, forex, commodities and economic events",
          parameters: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: ["all", "stocks", "crypto", "forex", "commodities", "economy"],
                description: "News category filter. Defaults to 'all'."
              }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_market_trends",
          description: "Get comprehensive market trend analysis including sector performance, market sentiment, momentum indicators, and key support/resistance levels",
          parameters: {
            type: "object",
            properties: {
              market: {
                type: "string",
                enum: ["us_stocks", "crypto", "forex", "dse", "global"],
                description: "Market to analyze. Defaults to 'global'."
              }
            },
            required: []
          }
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
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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
        let toolCalls: any[] = [];

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
                    } catch {}

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
                      Authorization: `Bearer ${LOVABLE_API_KEY}`,
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

function formatNumber(num: number): string {
  if (!num) return "N/A";
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  return num.toLocaleString();
}
