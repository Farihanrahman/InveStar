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
      description: "Search the web for real-time information about stocks, crypto, forex, commodities, financial news, earnings, economic indicators.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query — be specific with tickers and topics" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_chart",
      description: "Generate a chart to visualize financial data. Use this whenever the user asks about a stock, crypto, index, or any asset. Generate price history, comparison charts, or performance charts.",
      parameters: {
        type: "object",
        properties: {
          chart_type: {
            type: "string",
            enum: ["price_history", "comparison", "performance", "candlestick_summary"],
            description: "Type of chart to generate",
          },
          title: { type: "string", description: "Chart title" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string", description: "X-axis label (date, period, or category)" },
                value: { type: "number", description: "Primary value" },
                value2: { type: "number", description: "Secondary value for comparisons" },
                open: { type: "number" },
                high: { type: "number" },
                low: { type: "number" },
                close: { type: "number" },
                volume: { type: "number" },
              },
              required: ["label"],
            },
            description: "Chart data points",
          },
          series_labels: {
            type: "array",
            items: { type: "string" },
            description: "Labels for data series (e.g., ['AAPL', 'GOOGL'])",
          },
          y_axis_prefix: { type: "string", description: "Prefix for Y axis values (e.g., '$', '৳')" },
          color: { type: "string", enum: ["green", "blue", "orange", "purple", "red"], description: "Primary chart color" },
        },
        required: ["chart_type", "title", "data"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_portfolio",
      description: "Get the user's current portfolio holdings.",
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
      description: "Get the user's virtual trading portfolio.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

const SYSTEM_PROMPT = `You are InveStar AI Analyst — an expert financial analyst embedded in a trading platform. You provide real-time market insights with rich visual charts.

## KEY BEHAVIOR: Always Use the generate_chart Tool
When a user asks about ANY stock, crypto, index, ETF, commodity, or forex pair:
1. First use web_search to get the latest news and data
2. Then ALWAYS call the generate_chart TOOL to create a visual chart
3. NEVER paste chart JSON in your text response — the tool renders it automatically
4. Include key metrics in your text response alongside the chart
5. Only generate ONE chart per response unless specifically asked for multiple

## Chart Data Format — CRITICAL
- Every data point MUST use the "value" field for the numeric amount
- CORRECT: {"label": "Jan 2025", "value": 150.50}
- WRONG: {"label": "Jan 2025", "close": 150.50}
- WRONG: {"label": "Jan 2025", "price": 150.50}
- Include 6-10 data points for meaningful visualization
- The final data point MUST reflect the current/live price

## Chart Types
- "price_history": For a single asset's price over time (area chart)
- "comparison": For comparing two assets (use value + value2 with series_labels)
- "performance": For showing returns/performance (bar chart, values in %)

## Your Expertise
- US Markets (NYSE, NASDAQ), European (FTSE, DAX), Asian (Nikkei, Hang Seng, SENSEX)
- Bangladesh: DSE, Sanchaypatra, Bangladesh Bank
- Crypto: BTC, ETH, SOL, XLM, stablecoins
- Forex, Commodities, ETFs, Mutual Funds
- Macro economics, central bank policies

## Rules
- If the user provides a current live price, USE THAT EXACT PRICE — do not override with search results
- Cite sources with URLs when possible
- Add disclaimer: "This is educational content, not licensed financial advice"
- Use markdown formatting — be concise but insightful`;

async function executeTool(
  toolName: string,
  args: Record<string, any>,
  supabaseClient: any,
  userId: string | null
): Promise<string> {
  try {
    switch (toolName) {
      case "web_search": {
        const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
        if (!firecrawlKey) return JSON.stringify({ error: "Web search not configured" });
        const resp = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query: args.query, limit: 5, scrapeOptions: { formats: ["markdown"] } }),
        });
        const data = await resp.json();
        if (!resp.ok) return JSON.stringify({ error: data.error || "Search failed" });
        const results = (data.data || []).map((r: any) => ({
          title: r.title, url: r.url,
          snippet: r.description || r.markdown?.substring(0, 500),
        }));
        return JSON.stringify({ results });
      }

      case "generate_chart": {
        // Just pass through — the frontend will render this
        return JSON.stringify({ chart_generated: true, ...args });
      }

      case "get_portfolio": {
        if (!userId) return JSON.stringify({ error: "Not authenticated" });
        const { data, error } = await supabaseClient.from("portfolio_holdings").select("*").eq("user_id", userId);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ holdings: data });
      }

      case "get_watchlist": {
        if (!userId) return JSON.stringify({ error: "Not authenticated" });
        const { data, error } = await supabaseClient.from("watchlist").select("*").eq("user_id", userId);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ watchlist: data });
      }

      case "get_virtual_portfolio": {
        if (!userId) return JSON.stringify({ error: "Not authenticated" });
        const { data: portfolio } = await supabaseClient.from("virtual_portfolios").select("*").eq("user_id", userId).single();
        const { data: trades } = await supabaseClient.from("virtual_trades").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10);
        return JSON.stringify({ portfolio, recent_trades: trades });
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
    const { messages, context, userId } = await req.json();
    const AI_GATEWAY_API_KEY = Deno.env.get("AI_GATEWAY_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
    if (!AI_GATEWAY_API_KEY) throw new Error("AI gateway API key is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    let systemContent = SYSTEM_PROMPT;
    if (context) {
      systemContent += `\n\nUser is currently on the ${context} page. Tailor your analysis accordingly.`;
    }

    const allMessages = [{ role: "system", content: systemContent }, ...messages];
    const MAX_ITERATIONS = 5;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const currentMessages = [...allMessages];

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
              if (response.status === 429) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", content: "Rate limit exceeded. Please try again in a moment." })}\n\n`));
              } else if (response.status === 402) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", content: "AI credits exhausted. Please top up." })}\n\n`));
              } else {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", content: "AI service unavailable" })}\n\n`));
              }
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
                try { toolArgs = JSON.parse(toolCall.function.arguments || "{}"); } catch { }

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_call", tool: toolName, args: toolArgs })}\n\n`));

                const result = await executeTool(toolName, toolArgs, supabaseClient, userId);

                // For chart tool, emit chart data to frontend
                if (toolName === "generate_chart") {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "chart", ...toolArgs })}\n\n`));
                } else {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_result", tool: toolName })}\n\n`));
                }

                currentMessages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: result,
                });
              }
              continue;
            }

            // Stream final response
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
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", content: "Stream error" })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    console.error("investar-analyst error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
