import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Activity, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { toast } from "sonner";
import { useConfetti } from "@/hooks/useConfetti";

interface StockDetailModalProps {
  symbol: string;
  name: string;
  isOpen: boolean;
  onClose: () => void;
  isBDT?: boolean;
  initialPrice?: number;
}

interface HistoricalData {
  date: string;
  price: number;
}

interface HistoricalResponse {
  data: HistoricalData[];
  currentPrice: number;
  startPrice: number;
  change: number;
  changePercent: number;
}

type TimePeriod = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y";

const StockDetailModal = ({ symbol, name, isOpen, onClose, isBDT = false, initialPrice }: StockDetailModalProps) => {
  const [chartData, setChartData] = useState<HistoricalData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [periodChange, setPeriodChange] = useState<number>(0);
  const [periodChangePercent, setPeriodChangePercent] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("1M");
  
  // Trade state
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [tradeShares, setTradeShares] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const { triggerConfetti } = useConfetti();
  const currencySymbol = isBDT ? "৳" : "$";

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id || null);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchHistoricalData = useCallback(async (period: TimePeriod) => {
    setIsChartLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-historical-prices', {
        body: { symbol, period }
      });

      if (error) throw error;

      if (data?.data && data.data.length > 0) {
        setChartData(data.data);
        setCurrentPrice(data.currentPrice);
        setPeriodChange(data.change);
        setPeriodChangePercent(data.changePercent);
      } else {
        const fallbackData = generateFallbackData(period);
        setChartData(fallbackData.data);
        setCurrentPrice(fallbackData.currentPrice);
        setPeriodChange(fallbackData.change);
        setPeriodChangePercent(fallbackData.changePercent);
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
      const fallbackData = generateFallbackData(period);
      setChartData(fallbackData.data);
      setCurrentPrice(fallbackData.currentPrice);
      setPeriodChange(fallbackData.change);
      setPeriodChangePercent(fallbackData.changePercent);
    } finally {
      setIsChartLoading(false);
      setIsLoading(false);
    }
  }, [symbol]);

  const generateFallbackData = (period: TimePeriod): HistoricalResponse => {
    // Use initialPrice from Dashboard if available, otherwise use defaults
    const basePrice = initialPrice || (isBDT ? 245.80 : 182.52);
    const points: HistoricalData[] = [];
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
      if (period === "1D") {
        date.setHours(date.getHours() - (numPoints - i));
        points.push({ date: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), price });
      } else if (period === "5Y") {
        date.setMonth(date.getMonth() - (numPoints - i));
        points.push({ date: date.toLocaleDateString([], { month: 'short', year: '2-digit' }), price });
      } else {
        date.setDate(date.getDate() - (numPoints - i));
        points.push({ date: date.toLocaleDateString([], { month: 'short', day: 'numeric' }), price });
      }
    }

    points[points.length - 1].price = basePrice;
    const priceChange = basePrice - startPrice;
    const changePercent = (priceChange / startPrice) * 100;

    return { data: points, currentPrice: basePrice, startPrice, change: priceChange, changePercent };
  };

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setShowTradeForm(false);
      setTradeShares("");
      fetchHistoricalData(timePeriod);
    }
  }, [isOpen, symbol, fetchHistoricalData]);

  useEffect(() => {
    if (isOpen && !isLoading) {
      fetchHistoricalData(timePeriod);
    }
  }, [timePeriod]);

  const handleTrade = async () => {
    if (!isAuthenticated || !userId) {
      toast.error("Please sign in to trade");
      return;
    }
    if (!tradeShares) {
      toast.error("Please enter number of shares");
      return;
    }
    
    const shares = parseFloat(tradeShares);
    if (isNaN(shares) || shares <= 0) {
      toast.error("Please enter a valid number of shares");
      return;
    }
    
    const total = currentPrice * shares;
    
    const { data: existingHolding } = await supabase
      .from('portfolio_holdings')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', symbol)
      .maybeSingle();
    
    if (tradeType === "buy") {
      await supabase.from('portfolio_transactions').insert({
        user_id: userId,
        symbol,
        name,
        transaction_type: 'buy',
        shares,
        price: currentPrice,
        total
      });

      if (existingHolding) {
        const newShares = Number(existingHolding.shares) + shares;
        const newAvgCost = ((Number(existingHolding.shares) * Number(existingHolding.avg_cost)) + (shares * currentPrice)) / newShares;
        
        await supabase.from('portfolio_holdings')
          .update({ shares: newShares, avg_cost: newAvgCost })
          .eq('user_id', userId)
          .eq('symbol', symbol);
      } else {
        await supabase.from('portfolio_holdings').insert({
          user_id: userId,
          symbol,
          name,
          shares,
          avg_cost: currentPrice
        });
      }
      toast.success(`Bought ${shares} shares of ${symbol} at ${currencySymbol}${currentPrice.toFixed(2)}`);
      triggerConfetti('buy');
    } else {
      if (!existingHolding) {
        toast.error(`You don't own any ${symbol}`);
        return;
      }
      
      if (shares > Number(existingHolding.shares)) {
        toast.error(`You only own ${existingHolding.shares} shares of ${symbol}`);
        return;
      }
      
      await supabase.from('portfolio_transactions').insert({
        user_id: userId,
        symbol,
        name: existingHolding.name,
        transaction_type: 'sell',
        shares,
        price: currentPrice,
        total
      });

      if (shares === Number(existingHolding.shares)) {
        await supabase.from('portfolio_holdings')
          .delete()
          .eq('user_id', userId)
          .eq('symbol', symbol);
      } else {
        await supabase.from('portfolio_holdings')
          .update({ shares: Number(existingHolding.shares) - shares })
          .eq('user_id', userId)
          .eq('symbol', symbol);
      }
      toast.success(`Sold ${shares} shares of ${symbol} at ${currencySymbol}${currentPrice.toFixed(2)}`);
      triggerConfetti('sell');
    }
    
    setTradeShares("");
    setShowTradeForm(false);
  };

  const openTradeForm = (type: "buy" | "sell") => {
    if (!isAuthenticated) {
      toast.error("Please sign in to trade");
      return;
    }
    setTradeType(type);
    setShowTradeForm(true);
  };

  const isPositive = periodChange >= 0;
  
  const getPeriodLabel = (period: TimePeriod) => {
    switch (period) {
      case "1D": return "Today";
      case "1W": return "Past Week";
      case "1M": return "Past Month";
      case "3M": return "Past 3 Months";
      case "1Y": return "Past Year";
      case "5Y": return "Past 5 Years";
    }
  };

  const stats = {
    marketCap: isBDT ? "৳125.4B" : "$2.87T",
    peRatio: "28.5",
    eps: isBDT ? "৳8.62" : "$6.42",
    dividend: "0.52%",
    volume: isBDT ? "2.4M" : "58.2M",
    avgVolume: isBDT ? "3.1M" : "62.5M",
    high52w: `${currencySymbol}${(currentPrice * 1.25).toFixed(2)}`,
    low52w: `${currencySymbol}${(currentPrice * 0.72).toFixed(2)}`,
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">{symbol}</DialogTitle>
              <p className="text-muted-foreground">{name}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Price Section with Buy/Sell Buttons */}
            <div className="space-y-3">
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-4xl font-bold">
                    {currencySymbol}{currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <div className={`flex items-center gap-1 text-lg font-medium ${isPositive ? 'text-accent' : 'text-destructive'}`}>
                    {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    <span>{isPositive ? '+' : ''}{periodChange.toFixed(2)}</span>
                    <span>({isPositive ? '+' : ''}{periodChangePercent.toFixed(2)}%)</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{getPeriodLabel(timePeriod)}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => openTradeForm("buy")}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Buy
                  </Button>
                  <Button 
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => openTradeForm("sell")}
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Sell
                  </Button>
                </div>
              </div>

              {/* Trade Form */}
              {showTradeForm && (
                <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">
                      {tradeType === "buy" ? "Buy" : "Sell"} {symbol}
                    </h4>
                    <Button variant="ghost" size="sm" onClick={() => setShowTradeForm(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modal-shares">Number of Shares</Label>
                    <Input 
                      id="modal-shares"
                      type="number" 
                      placeholder="e.g., 10" 
                      value={tradeShares}
                      onChange={(e) => setTradeShares(e.target.value)}
                      min="0"
                      step="1"
                    />
                  </div>
                  {tradeShares && !isNaN(parseFloat(tradeShares)) && (
                    <div className="p-2 bg-background rounded text-sm">
                      <span className="text-muted-foreground">Estimated Total: </span>
                      <span className="font-semibold">
                        {currencySymbol}{(currentPrice * parseFloat(tradeShares)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <Button 
                    onClick={handleTrade} 
                    className={`w-full ${tradeType === "buy" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                  >
                    Confirm {tradeType === "buy" ? "Buy" : "Sell"}
                  </Button>
                </div>
              )}
            </div>

            {/* Chart */}
            <div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {(["1D", "1W", "1M", "3M", "1Y", "5Y"] as TimePeriod[]).map((period) => (
                  <Button
                    key={period}
                    variant={timePeriod === period ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimePeriod(period)}
                  >
                    {period}
                  </Button>
                ))}
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPositive ? "hsl(var(--accent))" : "hsl(var(--destructive))"} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={isPositive ? "hsl(var(--accent))" : "hsl(var(--destructive))"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      domain={['auto', 'auto']}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={(value) => `${currencySymbol}${value.toFixed(0)}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, 'Price']}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={isPositive ? "hsl(var(--accent))" : "hsl(var(--destructive))"}
                      strokeWidth={2}
                      fill="url(#colorPrice)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Key Statistics */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Key Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatItem label="Market Cap" value={stats.marketCap} icon={<DollarSign className="w-4 h-4" />} />
                <StatItem label="P/E Ratio" value={stats.peRatio} icon={<Activity className="w-4 h-4" />} />
                <StatItem label="EPS" value={stats.eps} icon={<DollarSign className="w-4 h-4" />} />
                <StatItem label="Dividend Yield" value={stats.dividend} icon={<DollarSign className="w-4 h-4" />} />
                <StatItem label="Volume" value={stats.volume} icon={<BarChart3 className="w-4 h-4" />} />
                <StatItem label="Avg Volume" value={stats.avgVolume} icon={<BarChart3 className="w-4 h-4" />} />
                <StatItem label="52W High" value={stats.high52w} icon={<TrendingUp className="w-4 h-4" />} />
                <StatItem label="52W Low" value={stats.low52w} icon={<TrendingDown className="w-4 h-4" />} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button className="flex-1" variant="default">
                Add to Watchlist
              </Button>
              <Button className="flex-1" variant="outline" onClick={() => window.open(`https://finance.yahoo.com/quote/${symbol}`, '_blank')}>
                View on Yahoo Finance
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const StatItem = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="p-3 rounded-lg bg-muted/50">
    <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
      {icon}
      {label}
    </div>
    <div className="font-semibold">{value}</div>
  </div>
);

export default StockDetailModal;
