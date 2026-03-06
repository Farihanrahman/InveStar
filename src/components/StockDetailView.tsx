import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type TimePeriod = "1D" | "1W" | "1M" | "6M" | "1Y" | "5Y";

interface StockDetailViewProps {
  symbol: string;
  onBuyClick?: () => void;
  onSellClick?: () => void;
}

const StockDetailView = ({ symbol, onBuyClick, onSellClick }: StockDetailViewProps) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("1M");
  const [analysis, setAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Mock stock data - in production, this would come from an API
  const stockData: Record<string, any> = {
    AAPL: {
      name: "Apple Inc.",
      price: 182.52,
      change: 2.45,
      changePercent: 1.36,
      marketCap: "2.89T",
      peRatio: 29.48,
      dividendYield: 0.48,
      high52Week: 199.62,
      low52Week: 164.08,
      volume: "52.4M",
      avgVolume: "55.2M",
      beta: 1.29,
      eps: 6.19,
    },
    NVDA: {
      name: "NVIDIA Corp.",
      price: 138.45,
      change: 3.21,
      changePercent: 2.37,
      marketCap: "3.40T",
      peRatio: 65.82,
      dividendYield: 0.03,
      high52Week: 152.89,
      low52Week: 108.13,
      volume: "298.5M",
      avgVolume: "325.8M",
      beta: 1.68,
      eps: 2.10,
    },
    GOOGL: {
      name: "Alphabet Inc.",
      price: 142.38,
      change: -1.23,
      changePercent: -0.86,
      marketCap: "1.78T",
      peRatio: 26.74,
      dividendYield: 0.00,
      high52Week: 152.46,
      low52Week: 120.21,
      volume: "28.3M",
      avgVolume: "30.1M",
      beta: 1.05,
      eps: 5.32,
    },
    MSFT: {
      name: "Microsoft Corp.",
      price: 415.45,
      change: 5.32,
      changePercent: 1.30,
      marketCap: "3.09T",
      peRatio: 36.42,
      dividendYield: 0.72,
      high52Week: 430.82,
      low52Week: 362.90,
      volume: "22.1M",
      avgVolume: "24.5M",
      beta: 0.89,
      eps: 11.41,
    },
    AMZN: {
      name: "Amazon.com Inc.",
      price: 218.75,
      change: 4.12,
      changePercent: 1.92,
      marketCap: "2.26T",
      peRatio: 58.34,
      dividendYield: 0.00,
      high52Week: 231.20,
      low52Week: 168.64,
      volume: "48.2M",
      avgVolume: "52.3M",
      beta: 1.15,
      eps: 3.75,
    },
    TSLA: {
      name: "Tesla Inc.",
      price: 248.32,
      change: -5.67,
      changePercent: -2.23,
      marketCap: "789B",
      peRatio: 68.92,
      dividendYield: 0.00,
      high52Week: 299.29,
      low52Week: 138.80,
      volume: "112.5M",
      avgVolume: "125.6M",
      beta: 2.01,
      eps: 3.60,
    },
    META: {
      name: "Meta Platforms Inc.",
      price: 612.89,
      change: 8.45,
      changePercent: 1.40,
      marketCap: "1.55T",
      peRatio: 29.45,
      dividendYield: 0.30,
      high52Week: 638.25,
      low52Week: 448.72,
      volume: "18.4M",
      avgVolume: "20.8M",
      beta: 1.22,
      eps: 20.81,
    },
    JPM: {
      name: "JPMorgan Chase & Co.",
      price: 238.56,
      change: 1.89,
      changePercent: 0.80,
      marketCap: "682B",
      peRatio: 12.45,
      dividendYield: 2.15,
      high52Week: 248.92,
      low52Week: 195.32,
      volume: "8.2M",
      avgVolume: "9.5M",
      beta: 1.08,
      eps: 19.15,
    },
    V: {
      name: "Visa Inc.",
      price: 322.15,
      change: 2.34,
      changePercent: 0.73,
      marketCap: "642B",
      peRatio: 33.82,
      dividendYield: 0.68,
      high52Week: 338.45,
      low52Week: 278.56,
      volume: "5.8M",
      avgVolume: "6.4M",
      beta: 0.95,
      eps: 9.52,
    },
    WMT: {
      name: "Walmart Inc.",
      price: 98.45,
      change: 0.89,
      changePercent: 0.91,
      marketCap: "528B",
      peRatio: 38.24,
      dividendYield: 1.12,
      high52Week: 102.34,
      low52Week: 78.92,
      volume: "12.3M",
      avgVolume: "14.2M",
      beta: 0.52,
      eps: 2.58,
    },
    SQURPHARMA: {
      name: "Square Pharma",
      price: 245.80,
      change: 3.20,
      changePercent: 1.32,
      marketCap: "19.5B",
      peRatio: 18.24,
      dividendYield: 2.45,
      high52Week: 268.40,
      low52Week: 210.30,
      volume: "245K",
      avgVolume: "320K",
      beta: 0.72,
      eps: 13.48,
    },
    GP: {
      name: "Grameenphone",
      price: 325.60,
      change: -2.40,
      changePercent: -0.73,
      marketCap: "442B",
      peRatio: 15.82,
      dividendYield: 5.23,
      high52Week: 358.20,
      low52Week: 298.50,
      volume: "1.2M",
      avgVolume: "1.5M",
      beta: 0.65,
      eps: 20.58,
    },
    BRACBANK: {
      name: "BRAC Bank",
      price: 48.25,
      change: 0.85,
      changePercent: 1.79,
      marketCap: "8.2B",
      peRatio: 10.45,
      dividendYield: 3.85,
      high52Week: 52.80,
      low52Week: 42.10,
      volume: "1.8M",
      avgVolume: "2.1M",
      beta: 0.88,
      eps: 4.62,
    },
    BEXIMCO: {
      name: "Beximco Pharma",
      price: 112.30,
      change: -1.45,
      changePercent: -1.27,
      marketCap: "12.5B",
      peRatio: 15.32,
      dividendYield: 1.85,
      high52Week: 128.50,
      low52Week: 98.20,
      volume: "850K",
      avgVolume: "920K",
      beta: 0.95,
      eps: 7.33,
    },
    RENATA: {
      name: "Renata Limited",
      price: 892.50,
      change: 12.30,
      changePercent: 1.40,
      marketCap: "15.8B",
      peRatio: 22.45,
      dividendYield: 2.15,
      high52Week: 945.20,
      low52Week: 785.40,
      volume: "125K",
      avgVolume: "148K",
      beta: 0.68,
      eps: 39.75,
    },
    ACI: {
      name: "ACI Limited",
      price: 185.40,
      change: 2.15,
      changePercent: 1.17,
      marketCap: "9.8B",
      peRatio: 16.82,
      dividendYield: 2.85,
      high52Week: 198.50,
      low52Week: 165.30,
      volume: "420K",
      avgVolume: "485K",
      beta: 0.78,
      eps: 11.02,
    },
    OLYMPIC: {
      name: "Olympic Industries",
      price: 156.80,
      change: -0.95,
      changePercent: -0.60,
      marketCap: "7.2B",
      peRatio: 19.24,
      dividendYield: 1.95,
      high52Week: 172.40,
      low52Week: 142.50,
      volume: "315K",
      avgVolume: "368K",
      beta: 0.82,
      eps: 8.15,
    },
    BATBC: {
      name: "British American Tobacco",
      price: 458.30,
      change: 3.85,
      changePercent: 0.85,
      marketCap: "28.5B",
      peRatio: 12.68,
      dividendYield: 6.25,
      high52Week: 485.60,
      low52Week: 425.20,
      volume: "95K",
      avgVolume: "112K",
      beta: 0.58,
      eps: 36.15,
    },
    BSRMSTEEL: {
      name: "BSRM Steel",
      price: 68.45,
      change: 1.25,
      changePercent: 1.86,
      marketCap: "5.8B",
      peRatio: 14.32,
      dividendYield: 2.45,
      high52Week: 74.80,
      low52Week: 58.20,
      volume: "2.1M",
      avgVolume: "2.4M",
      beta: 1.12,
      eps: 4.78,
    },
    LHBL: {
      name: "LafargeHolcim Bangladesh",
      price: 95.80,
      change: -0.65,
      changePercent: -0.67,
      marketCap: "6.5B",
      peRatio: 18.45,
      dividendYield: 1.85,
      high52Week: 105.40,
      low52Week: 88.30,
      volume: "685K",
      avgVolume: "748K",
      beta: 0.88,
      eps: 5.19,
    },
  };

  const stock = stockData[symbol] || stockData.AAPL;
  const isPositive = stock.change >= 0;

  // Mock price history data based on time period
  const priceHistoryMap: Record<TimePeriod, { label: string; price: number }[]> = {
    "1D": Array.from({ length: 7 }, (_, i) => ({
      label: `${9 + i * 2}:00`,
      price: stock.price + (Math.random() - 0.5) * 5,
    })),
    "1W": Array.from({ length: 7 }, (_, i) => ({
      label: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
      price: stock.price + (Math.random() - 0.5) * 10 - (7 - i) * 0.3,
    })),
    "1M": Array.from({ length: 30 }, (_, i) => ({
      label: `${i + 1}`,
      price: stock.price + (Math.random() - 0.5) * 20 - (30 - i) * 0.5,
    })),
    "6M": Array.from({ length: 26 }, (_, i) => ({
      label: `Wk ${i + 1}`,
      price: stock.price + (Math.random() - 0.5) * 30 - (26 - i) * 1,
    })),
    "1Y": Array.from({ length: 12 }, (_, i) => ({
      label: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
      price: stock.price + (Math.random() - 0.5) * 50 - (12 - i) * 2,
    })),
    "5Y": Array.from({ length: 5 }, (_, i) => ({
      label: `${2021 + i}`,
      price: stock.price * (0.5 + i * 0.15) + (Math.random() - 0.5) * 20,
    })),
  };

  const priceHistory = priceHistoryMap[timePeriod];
  const timePeriods: TimePeriod[] = ["1D", "1W", "1M", "6M", "1Y", "5Y"];

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysis("");
    
    try {
      const { data, error } = await supabase.functions.invoke('stock-analysis', {
        body: { symbol, stockData: stock }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      toast.success("AI analysis complete!");
    } catch (error) {
      console.error('Error getting AI analysis:', error);
      toast.error("Failed to analyze stock. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl mb-1">{symbol}</CardTitle>
            <p className="text-sm text-muted-foreground">{stock.name}</p>
          </div>
          <Badge variant={isPositive ? "default" : "destructive"} className="px-3 py-1">
            {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {isPositive ? '+' : ''}{stock.changePercent}%
          </Badge>
        </div>
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">${stock.price}</span>
            <span className={`text-lg font-semibold ${isPositive ? 'text-accent' : 'text-destructive'}`}>
              {isPositive ? '+' : ''}{stock.change}
            </span>
          </div>
          <div className="flex gap-2">
            {onBuyClick && (
              <Button 
                onClick={onBuyClick}
                className="flex-1"
                size="lg"
              >
                Buy {symbol}
              </Button>
            )}
            {onSellClick && (
              <Button 
                onClick={onSellClick}
                variant="destructive"
                className="flex-1"
                size="lg"
              >
                Sell {symbol}
              </Button>
            )}
            <Button 
              onClick={handleAIAnalysis} 
              disabled={isAnalyzing}
              variant="outline"
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isAnalyzing ? "Analyzing..." : "AI Analysis"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Analysis */}
        {analysis && (
          <div className="space-y-3">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-primary">InveStar AI Analysis</h3>
              </div>
              <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {analysis}
              </div>
            </div>
            <div className="p-3 bg-muted/50 border border-border rounded-lg">
              <p className="text-xs text-muted-foreground">
                ⚠️ Disclaimer: This AI analysis is for educational purposes only and should not be considered financial advice. 
                AI can make mistakes and may not have access to the most current market data. 
                Always conduct your own research and consult with a qualified financial advisor before making investment decisions.
              </p>
            </div>
          </div>
        )}

        {/* Price Chart */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Price History</h3>
            <div className="flex gap-1">
              {timePeriods.map((period) => (
                <Button
                  key={period}
                  variant={timePeriod === period ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimePeriod(period)}
                  className="h-7 px-2 text-xs"
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={priceHistory}>
              <XAxis 
                dataKey="label" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={isPositive ? "hsl(var(--accent))" : "hsl(var(--destructive))"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Key Statistics */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Key Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Market Cap</p>
              <p className="text-sm font-semibold">${stock.marketCap}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">P/E Ratio</p>
              <p className="text-sm font-semibold">{stock.peRatio}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">EPS</p>
              <p className="text-sm font-semibold">${stock.eps}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Dividend Yield</p>
              <p className="text-sm font-semibold">{stock.dividendYield}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">52W High</p>
              <p className="text-sm font-semibold">${stock.high52Week}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">52W Low</p>
              <p className="text-sm font-semibold">${stock.low52Week}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Volume</p>
              <p className="text-sm font-semibold">{stock.volume}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Beta</p>
              <p className="text-sm font-semibold">{stock.beta}</p>
            </div>
          </div>
        </div>

        {/* Trading Range */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">52-Week Range</h3>
          <div className="relative pt-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-destructive via-muted-foreground to-accent rounded-full"
                style={{
                  width: `${((stock.price - stock.low52Week) / (stock.high52Week - stock.low52Week)) * 100}%`
                }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>${stock.low52Week}</span>
              <span>${stock.high52Week}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockDetailView;
