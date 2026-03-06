import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HistoricalDataPoint {
  date: string;
  price: number;
}

// DSE symbols that don't exist on Yahoo Finance - generate fallback data
const dseSymbols = ["DSEBD", "SQURPHARMA", "BATBC", "GP", "BRAC", "RENATA", "BEXIMCO", "WALTONHIL", "ICB", "LANKABAFIN"];

// Base prices matching Dashboard.tsx for consistency
const dseBasePrices: Record<string, number> = {
  "DSEBD": 6234.45,
  "SQURPHARMA": 245.80,
  "BATBC": 485.50,
  "GP": 325.60,
  "BRAC": 48.75,
  "RENATA": 892.30,
  "BEXIMCO": 142.30,
  "WALTONHIL": 1245.00,
  "ICB": 87.50,
  "LANKABAFIN": 32.40,
};

// Symbol corrections for Yahoo Finance API
const symbolCorrections: Record<string, string> = {
  'NVIDIA': 'NVDA',
  'GOOGLE': 'GOOGL',
  'AMAZON': 'AMZN',
  'FACEBOOK': 'META',
  'MICROSOFT': 'MSFT',
  'APPLE': 'AAPL',
  'TESLA': 'TSLA',
  'NETFLIX': 'NFLX',
};

function generateFallbackData(symbol: string, period: string): {
  data: HistoricalDataPoint[];
  currentPrice: number;
  startPrice: number;
  change: number;
  changePercent: number;
} {
  const basePrice = dseBasePrices[symbol] || 100;
  const points: HistoricalDataPoint[] = [];
  let numPoints = 30;
  let volatility = 0.02;

  switch (period) {
    case "1D": numPoints = 24; volatility = 0.005; break;
    case "1W": numPoints = 7; volatility = 0.01; break;
    case "1M": numPoints = 30; volatility = 0.02; break;
    case "3M": numPoints = 90; volatility = 0.03; break;
    case "1Y": numPoints = 52; volatility = 0.05; break;
    case "5Y": numPoints = 60; volatility = 0.15; break;
  }

  let price = basePrice * (1 - volatility * 2);
  const startPrice = price;
  
  for (let i = 0; i < numPoints; i++) {
    const change = (Math.random() - 0.45) * volatility * basePrice;
    price = Math.max(price + change, basePrice * 0.7);
    
    const date = new Date();
    let dateStr: string;
    
    if (period === "1D") {
      date.setHours(date.getHours() - (numPoints - i));
      dateStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (period === "5Y") {
      date.setMonth(date.getMonth() - (numPoints - i));
      dateStr = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    } else {
      date.setDate(date.getDate() - (numPoints - i));
      dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    points.push({ date: dateStr, price: parseFloat(price.toFixed(2)) });
  }

  // Set last price to base price
  points[points.length - 1].price = basePrice;
  const priceChange = basePrice - startPrice;
  const changePercent = (priceChange / startPrice) * 100;

  return {
    data: points,
    currentPrice: basePrice,
    startPrice: parseFloat(startPrice.toFixed(2)),
    change: parseFloat(priceChange.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, period } = await req.json();
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching historical data for ${symbol}, period: ${period}`);

    // Apply symbol corrections
    const upperSymbol = symbol.toUpperCase();
    const correctedSymbol = symbolCorrections[upperSymbol] || symbol;

    // Check if this is a DSE symbol that needs fallback data
    if (dseSymbols.includes(upperSymbol)) {
      console.log(`Using fallback data for DSE symbol: ${symbol}`);
      const fallbackResult = generateFallbackData(upperSymbol, period);
      return new Response(
        JSON.stringify({
          symbol,
          period,
          ...fallbackResult,
          source: 'fallback',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map period to Yahoo Finance parameters
    let range = '1mo';
    let interval = '1d';
    
    switch (period) {
      case '1D':
        range = '1d';
        interval = '5m';
        break;
      case '1W':
        range = '5d';
        interval = '15m';
        break;
      case '1M':
        range = '1mo';
        interval = '1d';
        break;
      case '3M':
        range = '3mo';
        interval = '1d';
        break;
      case '1Y':
        range = '1y';
        interval = '1wk';
        break;
      case '5Y':
        range = '5y';
        interval = '1mo';
        break;
    }

    // Fetch from Yahoo Finance chart API (use corrected symbol)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(correctedSymbol)}?range=${range}&interval=${interval}`;
    
    console.log(`Fetching from: ${url} (original symbol: ${symbol}, corrected: ${correctedSymbol})`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.log(`Yahoo Finance returned ${response.status} for ${symbol}, using fallback`);
      // Return fallback data instead of throwing error
      const fallbackResult = generateFallbackData(symbol, period);
      return new Response(
        JSON.stringify({
          symbol,
          period,
          ...fallbackResult,
          source: 'fallback',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    if (!data.chart?.result?.[0]) {
      console.log('No chart data returned, using fallback');
      const fallbackResult = generateFallbackData(symbol, period);
      return new Response(
        JSON.stringify({
          symbol,
          period,
          ...fallbackResult,
          source: 'fallback',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const closes = quotes.close || [];

    // Build historical data points
    const historicalData: HistoricalDataPoint[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      const price = closes[i];
      if (price != null && !isNaN(price)) {
        const date = new Date(timestamps[i] * 1000);
        let dateStr: string;
        
        if (period === '1D') {
          dateStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (period === '5Y') {
          dateStr = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        } else {
          dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        
        historicalData.push({ date: dateStr, price: parseFloat(price.toFixed(2)) });
      }
    }

    // Get current price and calculate change
    const currentPrice = closes[closes.length - 1] || 0;
    const startPrice = closes.find((p: number) => p != null && !isNaN(p)) || currentPrice;
    const change = currentPrice - startPrice;
    const changePercent = startPrice > 0 ? (change / startPrice) * 100 : 0;

    console.log(`Returning ${historicalData.length} data points for ${symbol}`);

    return new Response(
      JSON.stringify({
        symbol,
        period,
        data: historicalData,
        currentPrice: parseFloat(currentPrice.toFixed(2)),
        startPrice: parseFloat(startPrice.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        source: 'yahoo_finance',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error fetching historical prices:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
