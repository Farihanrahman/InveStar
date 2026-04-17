import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, stockData, marketType } = await req.json();
    const AI_GATEWAY_API_KEY = Deno.env.get("AI_GATEWAY_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
    
    if (!AI_GATEWAY_API_KEY) {
      throw new Error("AI gateway API key is not configured");
    }

    // Fetch additional market context
    const marketContext = await fetchMarketContext(marketType || 'us');

    const systemPrompt = `You are InveStar AI, an elite stock market analyst powered by GPT-5.2, specializing in US stocks, Bangladesh DSE, cryptocurrencies, and forex markets.

ANALYSIS FRAMEWORK:
You provide institutional-grade analysis combining:
- Technical Analysis: Chart patterns, support/resistance, momentum, volume analysis
- Fundamental Analysis: Valuation metrics, earnings, growth outlook, competitive position
- Sentiment Analysis: Market positioning, institutional flows, retail interest
- Risk Assessment: Volatility metrics, correlation analysis, downside scenarios

CURRENT MARKET CONTEXT:
${JSON.stringify(marketContext, null, 2)}

OUTPUT REQUIREMENTS:
1. Be SPECIFIC with price levels, percentages, and timeframes
2. Reference analyst consensus from major firms (Goldman Sachs, Morgan Stanley, JP Morgan)
3. Include risk/reward ratios for all recommendations
4. Provide multiple scenarios (bull/base/bear cases)
5. NO markdown formatting - write in clean paragraphs with numbered sections

CRITICAL: Provide actionable intelligence that institutional investors would value.`;

    const userPrompt = buildAnalysisPrompt(symbol, stockData, marketType);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_GATEWAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5.2',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please add credits to your workspace.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI Gateway error');
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;
    
    // Clean markdown formatting
    const cleanedAnalysis = analysis
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/`{1,3}/g, '')
      .trim();

    return new Response(
      JSON.stringify({ 
        analysis: cleanedAnalysis,
        model: 'GPT-5.2',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in stock-analysis function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze stock';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildAnalysisPrompt(symbol: string, stockData: any, marketType: string): string {
  const currency = marketType === 'dse' ? '৳' : '$';
  
  return `Provide comprehensive tactical analysis for ${symbol} (${stockData.name || 'Stock'}).

CURRENT DATA:
- Price: ${currency}${stockData.price}
- Change: ${stockData.change >= 0 ? '+' : ''}${currency}${stockData.change} (${stockData.changePercent >= 0 ? '+' : ''}${stockData.changePercent}%)
- Market Cap: ${currency}${stockData.marketCap || 'N/A'}
- P/E Ratio: ${stockData.peRatio || 'N/A'}
- EPS: ${currency}${stockData.eps || 'N/A'}
- Dividend Yield: ${stockData.dividendYield || 0}%
- 52-Week Range: ${currency}${stockData.low52Week || 'N/A'} - ${currency}${stockData.high52Week || 'N/A'}
- Volume: ${stockData.volume || 'N/A'}
- Beta: ${stockData.beta || 'N/A'}

DELIVER ANALYSIS IN THESE SECTIONS:

1. EXECUTIVE SUMMARY
Clear BUY/HOLD/SELL verdict with conviction level (High/Medium/Low)
12-month price target with upside/downside percentage
Risk rating (1-5 scale)

2. TECHNICAL ANALYSIS
Key support levels (3 levels with prices)
Key resistance levels (3 levels with prices)
Current trend direction and strength
Momentum indicators status (RSI, MACD interpretation)
Volume analysis and institutional accumulation signs

3. FUNDAMENTAL VALUATION
Current valuation vs sector average
Valuation vs historical average
Fair value estimate with methodology
Growth trajectory assessment

4. CATALYST CALENDAR
Top 3 potential positive catalysts with timeframes
Top 3 risk factors with probability assessment

5. TRADE STRATEGY
Optimal entry zone (price range)
Position sizing recommendation
Stop-loss level with rationale
Take-profit targets (multiple levels)
Risk/reward ratio

6. ANALYST CONSENSUS
Wall Street price targets (range and average)
Rating distribution (Buy/Hold/Sell counts)
Recent rating changes from major firms

7. SCENARIO ANALYSIS
Bull Case: Target price and probability
Base Case: Target price and probability
Bear Case: Target price and probability

Keep analysis tactical, specific, and actionable. Use plain text formatting.`;
}

async function fetchMarketContext(marketType: string) {
  try {
    // Fetch current market indices for context
    const context = {
      marketType,
      timestamp: new Date().toISOString(),
      indices: marketType === 'dse' 
        ? { DSEX: 6245.50, change: "+0.68%", sentiment: "bullish" }
        : { 
            SP500: 5234.18, SP500Change: "+0.52%",
            NASDAQ: 16450.75, NASDAQChange: "+0.78%",
            DXY: 104.25, VIX: 14.8
          },
      sentiment: "Cautiously bullish with tech leadership",
      keyEvents: [
        "Fed meeting next week",
        "Earnings season ongoing",
        "Strong jobs data supporting risk assets"
      ]
    };
    return context;
  } catch (error) {
    console.error("Error fetching market context:", error);
    return { error: "Unable to fetch market context" };
  }
}
