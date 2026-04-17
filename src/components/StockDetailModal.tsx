import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Activity, X, Bot, Send, Loader2, Building2, Users, Calendar, PieChart, Globe, ExternalLink, Shield } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, Cell, Pie, PieChart as RechartsPie } from "recharts";
import { toast } from "sonner";
import { useConfetti } from "@/hooks/useConfetti";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import AIAnalystChart from "@/components/AIAnalystChart";

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

interface StockDetails {
  symbol: string;
  name: string;
  sector?: string;
  about?: string;
  incorporationYear?: string;
  listingYear?: string;
  website?: string;
  email?: string;
  address?: string;
  companySecretary?: string;
  marketCap?: string;
  freeFloatMarketCap?: string;
  peRatio?: string;
  trailingPE?: string;
  eps?: string;
  nav?: string;
  totalShares?: string;
  authorizedCapital?: string;
  paidUpCapital?: string;
  faceValue?: string;
  marketCategory?: string;
  creditRating?: string;
  lastDividendDate?: string;
  agmDate?: string;
  high52w?: string;
  low52w?: string;
  dayHigh?: string;
  dayLow?: string;
  volume?: string;
  dayValue?: string;
  dayTrades?: string;
  openPrice?: string;
  ycp?: string;
  rsi?: string;
  beta?: string;
  reserveSurplus?: string;
  operationalStatus?: string;
  cashDividends?: string;
  stockDividends?: string;
  shareholdingDate?: string;
  dividendHistory?: Array<{ year: string; cash: string; stock: string; eps: string; nav: string }>;
  financialPerformance?: Array<{ year: string; eps: string; nav: string; dividendPayout: string }>;
  technicalIndicators?: Array<{ name: string; value: string; interpretation?: string }>;
  shareholding?: Array<{ category: string; percentage: string }>;
  subsidiaries?: string[];
  boardOfDirectors?: Array<{ designation: string; name: string }>;
  events?: Array<{ date: string; event: string }>;
  source?: string;
}

type TimePeriod = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y";

const SHAREHOLDING_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#f59e0b', '#8b5cf6', '#ec4899'];

const StockDetailModal = ({ symbol, name, isOpen, onClose, isBDT = false, initialPrice }: StockDetailModalProps) => {
  const [analystOpen, setAnalystOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; content: string; parts?: any[] }>>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiThinking, setAiThinking] = useState("");
  const aiScrollRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState<HistoricalData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [periodChange, setPeriodChange] = useState<number>(0);
  const [periodChangePercent, setPeriodChangePercent] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("1M");
  const [stockDetails, setStockDetails] = useState<StockDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
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

  // Fetch rich stock details
  const fetchStockDetails = useCallback(async () => {
    setDetailsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stock-details', {
        body: { symbol, marketType: isBDT ? 'dse' : 'us' }
      });
      if (!error && data?.details) {
        setStockDetails(data.details);
      }
    } catch (err) {
      console.error('Error fetching stock details:', err);
    } finally {
      setDetailsLoading(false);
    }
  }, [symbol, isBDT]);

  const fetchHistoricalData = useCallback(async (period: TimePeriod) => {
    setIsChartLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-historical-prices', {
        body: { symbol, period }
      });
      if (error) throw error;
      if (data?.data && data.data.length > 0) {
        const livePrice = initialPrice && initialPrice > 0 ? initialPrice : data.currentPrice;
        const chartPoints = [...data.data];
        if (chartPoints.length > 0 && initialPrice && initialPrice > 0) {
          chartPoints[chartPoints.length - 1] = { ...chartPoints[chartPoints.length - 1], price: livePrice };
        }
        setChartData(chartPoints);
        setCurrentPrice(livePrice);
        const startPrice = chartPoints[0]?.price || data.startPrice || livePrice;
        const change = livePrice - startPrice;
        const changePercent = startPrice > 0 ? (change / startPrice) * 100 : 0;
        setPeriodChange(change);
        setPeriodChangePercent(changePercent);
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
  }, [symbol, initialPrice]);

  const generateFallbackData = (period: TimePeriod): HistoricalResponse => {
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
      setAnalystOpen(false);
      setAiMessages([]);
      setAiInput("");
      setAiLoading(false);
      setAiThinking("");
      setStockDetails(null);
      fetchHistoricalData(timePeriod);
      fetchStockDetails();
    }
  }, [isOpen, symbol, fetchHistoricalData, fetchStockDetails]);

  useEffect(() => {
    if (aiScrollRef.current) {
      aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
    }
  }, [aiMessages, aiThinking]);

  const extractInlineCharts = useCallback((text: string): any[] => {
    const charts: any[] = [];
    const patterns = [
      /```(?:json)?\s*(\{[\s\S]*?"chart_type"[\s\S]*?\})\s*```/g,
      /(\{[^{}]*"chart_type"\s*:\s*"[^"]+?"[^{}]*"data"\s*:\s*\[[\s\S]*?\]\s*[^{}]*\})/g,
    ];
    for (const regex of patterns) {
      let match;
      while ((match = regex.exec(text)) !== null) {
        try {
          const parsed = JSON.parse(match[1]);
          if (parsed.chart_type && parsed.data && Array.isArray(parsed.data)) {
            charts.push(parsed);
          }
        } catch { /* skip */ }
      }
    }
    return charts;
  }, []);

  const removeInlineChartJson = useCallback((text: string): string => {
    let cleaned = text.replace(/```(?:json)?\s*\{[\s\S]*?"chart_type"[\s\S]*?\}\s*```/g, '');
    cleaned = cleaned.replace(/\{[^{}]*"chart_type"\s*:\s*"[^"]+?"[^{}]*"data"\s*:\s*\[[\s\S]*?\]\s*[^{}]*\}/g, '');
    return cleaned.trim();
  }, []);

  const sendAiMessage = useCallback(async (messageText: string) => {
    const userMsg = { role: "user" as const, content: messageText };
    const allMsgs = [...aiMessages, userMsg];
    setAiMessages(allMsgs);
    setAiLoading(true);
    setAiThinking("Thinking…");
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/investar-analyst`;
    let assistantContent = "";
    const charts: any[] = [];
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: allMsgs.map(m => ({ role: m.role, content: m.content })),
          context: "markets",
          userId: session?.user?.id || null,
        }),
      });
      if (!response.ok || !response.body) {
        toast.error("Failed to get analysis");
        setAiLoading(false);
        setAiThinking("");
        return;
      }
      const reader = response.body.getReader();
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
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "tool_call") {
              setAiThinking(parsed.tool === "web_search" ? `🔍 Searching: ${parsed.args?.query || "..."}` : parsed.tool === "generate_chart" ? "📊 Generating chart…" : `🔧 ${parsed.tool}…`);
            } else if (parsed.type === "tool_result") {
              setAiThinking("Analyzing results…");
            } else if (parsed.type === "chart") {
              const { type: _t, ...chartFields } = parsed;
              charts.push(chartFields);
              setAiThinking("");
              const updateParts: any[] = [];
              charts.forEach(c => updateParts.push({ type: "chart", chart: c }));
              if (assistantContent) {
                const cleanedText = removeInlineChartJson(assistantContent);
                updateParts.push({ type: "text", content: cleanedText });
              }
              setAiMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, parts: updateParts } : m);
                }
                return [...prev, { role: "assistant" as const, content: assistantContent, parts: updateParts }];
              });
            } else if (parsed.type === "content") {
              setAiThinking("");
              assistantContent += parsed.content;
              const extractedCharts = extractInlineCharts(assistantContent);
              const cleanedText = removeInlineChartJson(assistantContent);
              const uniqueExtracted = extractedCharts.filter(ec =>
                !charts.some(tc => tc.title === ec.title && tc.chart_type === ec.chart_type)
              );
              const parts: any[] = [];
              charts.forEach(c => parts.push({ type: "chart", chart: c }));
              uniqueExtracted.forEach(c => parts.push({ type: "chart", chart: c }));
              parts.push({ type: "text", content: cleanedText });
              setAiMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: cleanedText, parts } : m);
                }
                return [...prev, { role: "assistant" as const, content: cleanedText, parts }];
              });
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
      if (charts.length > 0 && !assistantContent) {
        const parts = charts.map(c => ({ type: "chart", chart: c }));
        setAiMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, parts } : m);
          return [...prev, { role: "assistant" as const, content: "", parts }];
        });
      }
    } catch {
      toast.error("Failed to get analysis");
    }
    setAiLoading(false);
    setAiThinking("");
  }, [aiMessages]);

  const handleAskAI = () => {
    setAnalystOpen(true);
    const priceInfo = `The current live price of ${symbol} (${name}) displayed on our platform is ${currencySymbol}${currentPrice.toFixed(2)} with a ${periodChangePercent >= 0 ? '+' : ''}${periodChangePercent.toFixed(2)}% change (${getPeriodLabel(timePeriod)}). Use this exact price as the current price — do NOT search for a different current price. Search for recent news, outlook, and key metrics instead. Generate a chart using this price as the latest data point.`;
    sendAiMessage(priceInfo);
  };

  useEffect(() => {
    if (isOpen && !isLoading) {
      fetchHistoricalData(timePeriod);
    }
  }, [timePeriod]);

  const handleTrade = async () => {
    if (!isAuthenticated || !userId) { toast.error("Please sign in to trade"); return; }
    if (!tradeShares) { toast.error("Please enter number of shares"); return; }
    const shares = parseFloat(tradeShares);
    if (isNaN(shares) || shares <= 0) { toast.error("Please enter a valid number of shares"); return; }
    const total = currentPrice * shares;
    const { data: existingHolding } = await supabase
      .from('portfolio_holdings').select('*').eq('user_id', userId).eq('symbol', symbol).maybeSingle();
    if (tradeType === "buy") {
      await supabase.from('portfolio_transactions').insert({ user_id: userId, symbol, name, transaction_type: 'buy', shares, price: currentPrice, total });
      if (existingHolding) {
        const newShares = Number(existingHolding.shares) + shares;
        const newAvgCost = ((Number(existingHolding.shares) * Number(existingHolding.avg_cost)) + (shares * currentPrice)) / newShares;
        await supabase.from('portfolio_holdings').update({ shares: newShares, avg_cost: newAvgCost }).eq('user_id', userId).eq('symbol', symbol);
      } else {
        await supabase.from('portfolio_holdings').insert({ user_id: userId, symbol, name, shares, avg_cost: currentPrice });
      }
      toast.success(`Bought ${shares} shares of ${symbol} at ${currencySymbol}${currentPrice.toFixed(2)}`);
      triggerConfetti('buy');
    } else {
      if (!existingHolding) { toast.error(`You don't own any ${symbol}`); return; }
      if (shares > Number(existingHolding.shares)) { toast.error(`You only own ${existingHolding.shares} shares of ${symbol}`); return; }
      await supabase.from('portfolio_transactions').insert({ user_id: userId, symbol, name: existingHolding.name, transaction_type: 'sell', shares, price: currentPrice, total });
      if (shares === Number(existingHolding.shares)) {
        await supabase.from('portfolio_holdings').delete().eq('user_id', userId).eq('symbol', symbol);
      } else {
        await supabase.from('portfolio_holdings').update({ shares: Number(existingHolding.shares) - shares }).eq('user_id', userId).eq('symbol', symbol);
      }
      toast.success(`Sold ${shares} shares of ${symbol} at ${currencySymbol}${currentPrice.toFixed(2)}`);
      triggerConfetti('sell');
    }
    setTradeShares("");
    setShowTradeForm(false);
  };

  const openTradeForm = (type: "buy" | "sell") => {
    if (!isAuthenticated) { toast.error("Please sign in to trade"); return; }
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

  const d = stockDetails;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {symbol}
                {d?.sector && <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary">{d.sector}</span>}
                {d?.marketCategory && <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Cat {d.marketCategory}</span>}
              </DialogTitle>
              <p className="text-muted-foreground">{d?.name && d.name !== symbol ? d.name : name}</p>
              {d?.about && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{d.about}</p>}
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
          <div className="space-y-4">
            {/* Price Section */}
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
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => openTradeForm("buy")}>
                    <TrendingUp className="w-4 h-4 mr-2" /> Buy
                  </Button>
                  <Button className="bg-red-600 hover:bg-red-700" onClick={() => openTradeForm("sell")}>
                    <TrendingDown className="w-4 h-4 mr-2" /> Sell
                  </Button>
                </div>
              </div>

              {showTradeForm && (
                <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{tradeType === "buy" ? "Buy" : "Sell"} {symbol}</h4>
                    <Button variant="ghost" size="sm" onClick={() => setShowTradeForm(false)}><X className="w-4 h-4" /></Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modal-shares">Number of Shares</Label>
                    <Input id="modal-shares" type="number" placeholder="e.g., 10" value={tradeShares} onChange={(e) => setTradeShares(e.target.value)} min="0" step="1" />
                  </div>
                  {tradeShares && !isNaN(parseFloat(tradeShares)) && (
                    <div className="p-2 bg-background rounded text-sm">
                      <span className="text-muted-foreground">Estimated Total: </span>
                      <span className="font-semibold">{currencySymbol}{(currentPrice * parseFloat(tradeShares)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <Button onClick={handleTrade} className={`w-full ${tradeType === "buy" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
                    Confirm {tradeType === "buy" ? "Buy" : "Sell"}
                  </Button>
                </div>
              )}
            </div>

            {/* Chart */}
            <div>
              <div className="flex gap-2 mb-3 flex-wrap">
                {(["1D", "1W", "1M", "3M", "1Y", "5Y"] as TimePeriod[]).map((period) => (
                  <Button key={period} variant={timePeriod === period ? "default" : "outline"} size="sm" onClick={() => setTimePeriod(period)}>
                    {period}
                  </Button>
                ))}
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPositive ? "hsl(var(--accent))" : "hsl(var(--destructive))"} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={isPositive ? "hsl(var(--accent))" : "hsl(var(--destructive))"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(v) => `${currencySymbol}${v.toFixed(0)}`} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, 'Price']} />
                    <Area type="monotone" dataKey="price" stroke={isPositive ? "hsl(var(--accent))" : "hsl(var(--destructive))"} strokeWidth={2} fill="url(#colorPrice)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabbed Details Section */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-1">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="fundamentals" className="text-xs">Fundamentals</TabsTrigger>
                <TabsTrigger value="technicals" className="text-xs">Technicals</TabsTrigger>
                {d?.dividendHistory && <TabsTrigger value="dividends" className="text-xs">Dividends</TabsTrigger>}
                {d?.shareholding && <TabsTrigger value="ownership" className="text-xs">Ownership</TabsTrigger>}
                {d?.events && <TabsTrigger value="events" className="text-xs">Events</TabsTrigger>}
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-3 space-y-3">
                {/* Day's Trading Summary (DSE) */}
                {(d?.dayHigh || d?.dayLow || d?.openPrice || d?.ycp) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {d?.openPrice && <StatItem label="Open" value={d.openPrice} icon={<Activity className="w-3.5 h-3.5" />} />}
                    {d?.ycp && <StatItem label="Prev Close (YCP)" value={d.ycp} icon={<Activity className="w-3.5 h-3.5" />} />}
                    {d?.dayLow && d?.dayHigh && <StatItem label="Day Range" value={`${d.dayLow} – ${d.dayHigh}`} icon={<BarChart3 className="w-3.5 h-3.5" />} />}
                    {d?.dayTrades && <StatItem label="Trades" value={d.dayTrades} icon={<BarChart3 className="w-3.5 h-3.5" />} />}
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatItem label="Market Cap" value={d?.marketCap || "—"} icon={<DollarSign className="w-3.5 h-3.5" />} />
                  {d?.freeFloatMarketCap && <StatItem label="Free Float MCap" value={d.freeFloatMarketCap} icon={<DollarSign className="w-3.5 h-3.5" />} />}
                  <StatItem label="P/E Ratio" value={d?.peRatio || "—"} icon={<Activity className="w-3.5 h-3.5" />} />
                  <StatItem label="EPS" value={d?.eps || "—"} icon={<DollarSign className="w-3.5 h-3.5" />} />
                  <StatItem label="Volume" value={d?.volume || "—"} icon={<BarChart3 className="w-3.5 h-3.5" />} />
                  {d?.dayValue && <StatItem label="Day Value" value={d.dayValue} icon={<DollarSign className="w-3.5 h-3.5" />} />}
                  <StatItem label="52W High" value={d?.high52w || `${currencySymbol}${(currentPrice * 1.25).toFixed(2)}`} icon={<TrendingUp className="w-3.5 h-3.5" />} />
                  <StatItem label="52W Low" value={d?.low52w || `${currencySymbol}${(currentPrice * 0.72).toFixed(2)}`} icon={<TrendingDown className="w-3.5 h-3.5" />} />
                </div>
                {(d?.operationalStatus || d?.creditRating) && (
                  <div className="flex flex-wrap gap-3">
                    {d?.operationalStatus && (
                      <div className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">Status:</span>
                        <span className={`font-medium ${d.operationalStatus === 'Active' ? 'text-green-500' : ''}`}>{d.operationalStatus}</span>
                      </div>
                    )}
                    {d?.creditRating && (
                      <div className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">Rating:</span>
                        <span className="font-medium">{d.creditRating}</span>
                      </div>
                    )}
                  </div>
                )}
                {(d?.website || d?.listingYear || d?.agmDate) && (
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {d?.listingYear && <span>Listed: {d.listingYear}</span>}
                    {d?.agmDate && <span>Last AGM: {d.agmDate}</span>}
                    {d?.faceValue && <span>Face Value: {d.faceValue}</span>}
                    {d?.website && (
                      <a href={d.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                        <Globe className="w-3 h-3" /> {d.website.replace(/https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                )}
                {detailsLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading detailed data from DSE...
                  </div>
                )}
              </TabsContent>

              {/* Fundamentals Tab */}
              <TabsContent value="fundamentals" className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <StatItem label="Authorized Capital" value={d?.authorizedCapital || "—"} icon={<DollarSign className="w-3.5 h-3.5" />} />
                  <StatItem label="Paid-up Capital" value={d?.paidUpCapital || "—"} icon={<DollarSign className="w-3.5 h-3.5" />} />
                  <StatItem label="Total Shares" value={d?.totalShares || "—"} icon={<BarChart3 className="w-3.5 h-3.5" />} />
                  {d?.faceValue && <StatItem label="Face Value" value={d.faceValue} icon={<DollarSign className="w-3.5 h-3.5" />} />}
                  {d?.reserveSurplus && <StatItem label="Reserve & Surplus" value={d.reserveSurplus} icon={<DollarSign className="w-3.5 h-3.5" />} />}
                  {d?.trailingPE && <StatItem label="Trailing P/E" value={d.trailingPE} icon={<Activity className="w-3.5 h-3.5" />} />}
                </div>

                {/* Audited Financial Performance */}
                {d?.financialPerformance && d.financialPerformance.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><BarChart3 className="w-4 h-4 text-primary" /> Audited Performance</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-1.5 font-medium text-muted-foreground">Year</th>
                            <th className="text-right p-1.5 font-medium text-muted-foreground">EPS</th>
                            <th className="text-right p-1.5 font-medium text-muted-foreground">NAV</th>
                          </tr>
                        </thead>
                        <tbody>
                          {d.financialPerformance
                            .filter((fp, i, arr) => arr.findIndex(x => x.year === fp.year) === i)
                            .filter(fp => parseInt(fp.year) >= 2019 && parseInt(fp.year) <= 2025)
                            .sort((a, b) => parseInt(b.year) - parseInt(a.year))
                            .slice(0, 5)
                            .map((fp, i) => (
                              <tr key={i} className="border-b border-border/50">
                                <td className="p-1.5 font-medium">{fp.year}</td>
                                <td className="p-1.5 text-right">৳{fp.eps}</td>
                                <td className="p-1.5 text-right">৳{fp.nav}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Company Contact */}
                {(d?.address || d?.email || d?.companySecretary) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Building2 className="w-4 h-4 text-primary" /> Company Info</h4>
                    <div className="space-y-1 text-xs">
                      {d?.address && <p className="text-muted-foreground">📍 {d.address.replace(/\|/g, '').trim()}</p>}
                      {d?.email && <p className="text-muted-foreground">📧 {d.email.replace(/;/g, '').trim()}</p>}
                      {d?.companySecretary && <p className="text-muted-foreground">👤 Secretary: {d.companySecretary.replace(/\|/g, '').trim()}</p>}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Technicals Tab */}
              <TabsContent value="technicals" className="mt-3">
                {d?.technicalIndicators && d.technicalIndicators.length > 0 ? (
                  <div className="space-y-1.5">
                    {d.technicalIndicators.map((ti, i) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
                        <span className="font-medium">{ti.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{ti.value}</span>
                          {ti.interpretation && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              ti.interpretation === 'Bullish' ? 'bg-green-500/10 text-green-500' :
                              ti.interpretation === 'Oversold' ? 'bg-yellow-500/10 text-yellow-500' :
                              ti.interpretation === 'Overbought' ? 'bg-red-500/10 text-red-500' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {ti.interpretation}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Technical indicators not available.</p>
                )}
              </TabsContent>

              {/* Dividends Tab */}
              {d?.dividendHistory && (
                <TabsContent value="dividends" className="mt-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-2 font-medium text-muted-foreground">Year</th>
                          <th className="text-right p-2 font-medium text-muted-foreground">Cash</th>
                          <th className="text-right p-2 font-medium text-muted-foreground">Stock</th>
                          <th className="text-right p-2 font-medium text-muted-foreground">EPS</th>
                          <th className="text-right p-2 font-medium text-muted-foreground">NAV</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.dividendHistory.map((dh, i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="p-2 font-medium">{dh.year}</td>
                            <td className="p-2 text-right text-green-500">{dh.cash}</td>
                            <td className="p-2 text-right text-primary">{dh.stock}</td>
                            <td className="p-2 text-right">{dh.eps}</td>
                            <td className="p-2 text-right">{dh.nav}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              )}

              {/* Ownership Tab */}
              {d?.shareholding && (
                <TabsContent value="ownership" className="mt-3">
                  <div className="flex items-center gap-6">
                    <div className="w-40 h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={d.shareholding.map(s => ({ name: s.category, value: parseFloat(s.percentage) }))}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            innerRadius={35}
                          >
                            {d.shareholding.map((_, i) => (
                              <Cell key={i} fill={SHAREHOLDING_COLORS[i % SHAREHOLDING_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 flex-1">
                      {d.shareholding.map((sh, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SHAREHOLDING_COLORS[i % SHAREHOLDING_COLORS.length] }} />
                            <span>{sh.category}</span>
                          </div>
                          <span className="font-semibold">{sh.percentage}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* Events Tab */}
              {d?.events && (
                <TabsContent value="events" className="mt-3">
                  <div className="space-y-2">
                    {d.events.map((ev, i) => (
                      <div key={i} className="flex gap-3 text-sm p-2 rounded bg-muted/30">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{ev.date}</span>
                        <span>{ev.event.replace(/\|/g, '').trim()}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}
            </Tabs>

            {/* Source link */}
            {d?.source && (
              <a href={d.source} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                <ExternalLink className="w-3 h-3" /> View full data on source
              </a>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-3 border-t border-border">
              <Button className="flex-1 gap-2" variant="default" onClick={handleAskAI} disabled={analystOpen}>
                <Bot className="w-4 h-4" /> {analystOpen ? "AI Analyzing…" : "Ask AI Analyst"}
              </Button>
              <Button className="flex-1" variant="outline">Add to Watchlist</Button>
            </div>

            {/* AI Analyst Chat */}
            {analystOpen && (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-muted/50 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">AI Analysis — {symbol}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAnalystOpen(false)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <ScrollArea className="h-[300px] p-3" ref={aiScrollRef}>
                  <div className="space-y-3">
                    {aiMessages.filter(m => m.role === "assistant").map((msg, i) => (
                      <div key={i}>
                        {msg.parts ? (
                          <div className="space-y-3">
                            {msg.parts.map((part: any, j: number) => (
                              part.type === "chart" && part.chart ? (
                                <AIAnalystChart key={j} chart={part.chart} />
                              ) : part.type === "text" && part.content ? (
                                <div key={j} className="prose prose-sm dark:prose-invert max-w-none text-sm">
                                  <ReactMarkdown>{part.content}</ReactMarkdown>
                                </div>
                              ) : null
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    ))}
                    {aiThinking && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{aiThinking}</span>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="p-2 border-t border-border">
                  <div className="flex gap-2">
                    <Textarea
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (aiInput.trim() && !aiLoading) { sendAiMessage(aiInput.trim()); setAiInput(""); }
                        }
                      }}
                      placeholder="Ask a follow-up…"
                      className="min-h-[40px] max-h-[80px] resize-none text-sm"
                      disabled={aiLoading}
                    />
                    <Button
                      size="icon"
                      className="h-[40px] w-[40px] flex-shrink-0"
                      disabled={!aiInput.trim() || aiLoading}
                      onClick={() => { if (aiInput.trim()) { sendAiMessage(aiInput.trim()); setAiInput(""); } }}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const StatItem = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="p-2.5 rounded-lg bg-muted/50">
    <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
      {icon} {label}
    </div>
    <div className="font-semibold text-sm">{value}</div>
  </div>
);

export default StockDetailModal;
