import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for real-time information about global financial markets, stocks, ETFs, crypto, forex, commodities, economic indicators, central bank policies, IPOs, earnings, and any financial news worldwide. Also covers Bangladesh-specific data like DSE stocks, Sanchaypatra rates, and NRB rules.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query — be specific with market names, tickers, or topics" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "scrape_url",
      description: "Scrape a specific URL to extract its content as markdown. Use this when you need detailed information from a known webpage — financial reports, stock pages, news articles, regulatory filings, etc.",
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
      name: "get_portfolio",
      description: "Get the user's current portfolio holdings including symbols, shares, and average costs.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_wallet_balance",
      description: "Get the user's wallet balance (USD and USDC).",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_watchlist",
      description: "Get the user's watchlist of tracked securities.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_virtual_portfolio",
      description: "Get the user's virtual trading portfolio and balance.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recent_transactions",
      description: "Get the user's recent portfolio transactions.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_price_alerts",
      description: "Get the user's active price alerts.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_financial_goals",
      description: "Get the user's financial goals and their progress.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

const SYSTEM_PROMPT = `You are InveStar AI — a 24/7 global financial analyst, investment advisor, and cross-border payments specialist with agentic capabilities.

## Platform Context
InveStar is a Stellar-based remittance + investment platform, originally built for the Bangladeshi diaspora but serving users globally — including the Japan–US startup and investment corridor, working with partners like DNX Ventures and Hitachi Solutions.
- Remittance: USD→BDT via bKash, Nagad, Rocket, bank transfers (with expanding corridors including Japan–US)
- Investing: Global stocks, ETFs, crypto, DSE stocks, Sanchaypatra, FDRs
- Wallet: USDC on Stellar network
- Available on: Web app, Telegram (@investaraibot), WhatsApp

## Your Expertise — Global Coverage

### Markets & Investing
- **US Markets**: NYSE, NASDAQ (AAPL, TSLA, NVDA, etc.), S&P 500, Dow Jones
- **European Markets**: FTSE 100, DAX, CAC 40, Euro Stoxx
- **Asian Markets**: Nikkei 225, Shanghai Composite, Hang Seng, SENSEX, Nifty 50
- **Bangladesh**: DSE (DSEX, DS30), Sanchaypatra, Bangladesh Bank circulars, NRB rules
- **Japan**: TSE, JPX, EWJ/DXJ ETFs, NISA (少額投資非課税制度), iDeCo (個人型確定拠出年金)
- **Crypto**: Bitcoin, Ethereum, Solana, XRP, Stellar (XLM), stablecoins (USDC, USDT)
- **Forex**: Major pairs (EUR/USD, GBP/USD, USD/JPY), emerging market currencies (BDT, INR, PKR)
- **Commodities**: Gold, silver, oil, natural gas
- **Fixed Income**: US Treasuries, corporate bonds, Sanchaypatra, FDRs
- **ETFs & Mutual Funds**: Vanguard, BlackRock, ARK Invest, thematic ETFs
- **Macro Economics**: GDP, inflation, interest rates, central bank policies (Fed, ECB, BOJ, Bangladesh Bank)

### Cross-Border Payments
- **Payment rails**: SWIFT, SEPA, Faster Payments, ACH, Fedwire, CHIPS
- **Fintech solutions**: Wise, Revolut Business, Airwallex, Currencycloud
- **Japan-specific**: SBI Remit, Sony Bank, Japan Post Bank, ZENGIN system
- **Bangladesh-specific**: bKash, Nagad, Rocket, bank transfers
- **Fee structures**: 0.5–3% banks vs 0.3–0.8% fintechs, transfer times
- **Correspondent banking**: SWIFT gpi tracking, high-value wire vs batch remittance

### FX Strategy
- USD/JPY dynamics, Bank of Japan policy, YCC history
- USD/BDT dynamics, Bangladesh Bank interventions
- Hedging: FX forwards, options, NDFs, natural hedging
- Currency risk for startups receiving foreign VC funding
- FX timing strategy and volatility management

### Compliance & Regulation
- AML/CFT: FATF, FinCEN (US), JFSA (Japan), FCA (UK), Bangladesh Bank
- FBAR for US persons with >$10k in foreign accounts
- Form 8938 (FATCA), Form 5471 for US persons in foreign entities
- Japan FEFTA (外国為替及び外国貿易法), CRS reporting
- US-Japan tax treaty: 10% WHT on dividends, PFIC rules
- KYC requirements for cross-border accounts
- NRB investment rules and regulations

### Startup & VC Corridor (Kite Programme)
- Japan–US startup corridor: Hitachi Solutions Kite programme spin-outs
- Dual KK (株式会社) + Delaware C-Corp structures for fundraising
- J-KISS notes, SAFE agreements, cap table management
- Cross-border cap table management
- Remitting US VC proceeds to Japan-based or Bangladesh-based entities

## Your Tools
1. **web_search** — Search the web for real-time data on any global market, stock, crypto, forex rate, news, or economic indicator
2. **scrape_url** — Scrape a specific URL for detailed content (financial reports, articles, filings, stock pages)
3. **get_portfolio** — User's stock holdings (symbols, shares, avg cost)
4. **get_wallet_balance** — User's USD and USDC wallet balance
5. **get_watchlist** — User's tracked securities
6. **get_virtual_portfolio** — Virtual trading portfolio and balance
7. **get_recent_transactions** — Recent buy/sell transactions
8. **get_price_alerts** — Active price alerts
9. **get_financial_goals** — Financial goals and progress

## Rules
- ALWAYS use web_search for questions about current market data, prices, rates, or recent events
- Use scrape_url when you need to deep-dive into a specific page
- When analyzing a user's portfolio, first get their holdings, then search for current prices
- Cite sources with URLs when available
- Add disclaimer: "This is educational content, not licensed financial advice"
- Flag regulated advice with: ⚠ Advisory Note
- Use USD ($) as primary currency unless the user's context suggests otherwise (e.g., BDT ৳, JPY ¥)
- Respond in English by default, or match the user's language
- Use markdown formatting — tables for comparisons, bold for key metrics
- When comparing payment options, always compare at least 2 providers with fees and transfer times
- Include Japanese terms with translations when relevant: NISA (少額投資非課税制度)
- Never expose Stellar private keys, HSM endpoints, or internal API URLs
- Never initiate financial transactions — you are read-only and advisory
- When users ask about specific tickers, include key metrics: price, change %, market cap, P/E, volume when available`;


async function executeTool(
  toolName: string,
  args: Record<string, any>,
  supabase: any,
  userId: string | null
): Promise<string> {
  try {
    switch (toolName) {
      case "web_search": {
        const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
        if (!firecrawlKey) return JSON.stringify({ error: "Web search not configured" });

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
        });
        const data = await resp.json();
        if (!resp.ok) return JSON.stringify({ error: data.error || "Search failed" });

        const results = (data.data || []).map((r: any) => ({
          title: r.title,
          url: r.url,
          snippet: r.description || r.markdown?.substring(0, 500),
        }));
        return JSON.stringify({ results });
      }

      case "scrape_url": {
        const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
        if (!firecrawlKey) return JSON.stringify({ error: "Scraping not configured" });

        let url = (args.url || "").trim();
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          url = `https://${url}`;
        }

        const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
            formats: ["markdown"],
            onlyMainContent: true,
          }),
        });
        const data = await resp.json();
        if (!resp.ok) return JSON.stringify({ error: data.error || "Scrape failed" });

        const content = data.data?.markdown || data.markdown || "";
        const title = data.data?.metadata?.title || data.metadata?.title || url;
        // Truncate to avoid token overflow
        const truncated = content.length > 3000 ? content.substring(0, 3000) + "\n\n[...content truncated]" : content;
        return JSON.stringify({ title, url, content: truncated });
      }

      case "get_portfolio": {
        if (!userId) return JSON.stringify({ error: "Not authenticated" });
        const { data, error } = await supabase
          .from("portfolio_holdings")
          .select("*")
          .eq("user_id", userId);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ holdings: data });
      }

      case "get_wallet_balance": {
        if (!userId) return JSON.stringify({ error: "Not authenticated" });
        const { data, error } = await supabase
          .from("wallet_balances")
          .select("balance_usd, balance_usdc, stellar_public_key")
          .eq("user_id", userId)
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }

      case "get_watchlist": {
        if (!userId) return JSON.stringify({ error: "Not authenticated" });
        const { data, error } = await supabase
          .from("watchlist")
          .select("*")
          .eq("user_id", userId);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ watchlist: data });
      }

      case "get_virtual_portfolio": {
        if (!userId) return JSON.stringify({ error: "Not authenticated" });
        const { data: portfolio } = await supabase
          .from("virtual_portfolios")
          .select("*")
          .eq("user_id", userId)
          .single();
        const { data: trades } = await supabase
          .from("virtual_trades")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);
        return JSON.stringify({ portfolio, recent_trades: trades });
      }

      case "get_recent_transactions": {
        if (!userId) return JSON.stringify({ error: "Not authenticated" });
        const { data, error } = await supabase
          .from("portfolio_transactions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ transactions: data });
      }

      case "get_price_alerts": {
        if (!userId) return JSON.stringify({ error: "Not authenticated" });
        const { data, error } = await supabase
          .from("price_alerts")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "active");
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ alerts: data });
      }

      case "get_financial_goals": {
        if (!userId) return JSON.stringify({ error: "Not authenticated" });
        const { data, error } = await supabase
          .from("financial_goals")
          .select("*")
          .eq("user_id", userId);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ goals: data });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (e) {
    return JSON.stringify({ error: e instanceof Error ? e.message : "Tool execution failed" });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode, userId } = await req.json();
    const AI_GATEWAY_API_KEY = Deno.env.get("AI_GATEWAY_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
    if (!AI_GATEWAY_API_KEY) throw new Error("AI gateway API key is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let systemContent = SYSTEM_PROMPT;
    if (mode === "portfolio") systemContent += "\n\nFocus on portfolio allocation, risk metrics, and rebalancing across global markets.";
    else if (mode === "risk") systemContent += "\n\nFocus on downside risk, volatility, hedging, and global macro risks.";
    else if (mode === "income") systemContent += "\n\nFocus on dividend yields, fixed income, bond yields, Sanchaypatra rates, REITs, and passive income strategies globally.";
    else if (mode === "payments") systemContent += "\n\nFocus on cross-border payment routing, fee comparison, transfer speeds, and provider recommendations. Compare at least 2 options with specific fees and timelines.";
    else if (mode === "fx") systemContent += "\n\nFocus on FX strategy, currency hedging, forward contracts, and timing decisions. Include current rates and historical context.";
    else if (mode === "compliance") systemContent += "\n\nFocus on regulatory compliance, AML/KYC requirements, tax treaty implications, FBAR/FATCA reporting, and cross-border legal structures.";
    else if (mode === "startup") systemContent += "\n\nFocus on Japan–US startup corridor, VC structures, J-KISS/SAFE agreements, dual entity setups, and cross-border cap table management.";
    else if (mode === "compare") systemContent += "\n\nFocus on comparing financial service providers — banks vs fintechs vs brokers. Present comparisons in tables with fees, speeds, pros/cons, and ratings. Always compare at least 3 options.";

    const allMessages = [{ role: "system", content: systemContent }, ...messages];

    // Agentic loop - up to 5 tool-calling iterations
    const MAX_ITERATIONS = 5;
    let toolSteps: { tool: string; args: any; result: string }[] = [];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let currentMessages = [...allMessages];

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
                tools: TOOL_DEFINITIONS,
                tool_choice: "auto",
                stream: false,
              }),
            });

            if (!response.ok) {
              const errText = await response.text();
              console.error("AI gateway error:", response.status, errText);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", content: "AI service unavailable" })}\n\n`));
              break;
            }

            const data = await response.json();
            const choice = data.choices?.[0];
            if (!choice) break;

            const message = choice.message;

            if (message.tool_calls && message.tool_calls.length > 0) {
              currentMessages.push(message);

              for (const toolCall of message.tool_calls) {
                const toolName = toolCall.function.name;
                let toolArgs = {};
                try {
                  toolArgs = JSON.parse(toolCall.function.arguments || "{}");
                } catch { }

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: "tool_call",
                  tool: toolName,
                  args: toolArgs,
                })}\n\n`));

                const result = await executeTool(toolName, toolArgs, supabase, userId);

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: "tool_result",
                  tool: toolName,
                  result: JSON.parse(result),
                })}\n\n`));

                currentMessages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: result,
                });

                toolSteps.push({ tool: toolName, args: toolArgs, result });
              }
              continue;
            }

            if (message.content) {
              const streamResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${LOVABLE_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash",
                  messages: currentMessages,
                  stream: true,
                }),
              });

              if (streamResp.ok && streamResp.body) {
                const reader = streamResp.body.getReader();
                const decoder = new TextDecoder();
                let buf = "";
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  buf += decoder.decode(value, { stream: true });
                  let nl;
                  while ((nl = buf.indexOf("\n")) !== -1) {
                    const line = buf.slice(0, nl).trim();
                    buf = buf.slice(nl + 1);
                    if (!line.startsWith("data: ")) continue;
                    const json = line.slice(6);
                    if (json === "[DONE]") break;
                    try {
                      const p = JSON.parse(json);
                      const c = p.choices?.[0]?.delta?.content;
                      if (c) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "content", content: c })}\n\n`));
                      }
                    } catch { }
                  }
                }
              } else {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "content", content: message.content })}\n\n`));
              }
            }
            break;
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e) {
          console.error("Stream error:", e);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", content: e instanceof Error ? e.message : "Unknown error" })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    console.error("investar-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
