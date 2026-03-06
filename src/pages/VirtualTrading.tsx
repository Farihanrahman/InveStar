import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import VirtualPortfolioChart from "@/components/VirtualPortfolioChart";
import StockDetailView from "@/components/StockDetailView";
import StockSearchBar from "@/components/StockSearchBar";
import VirtualHoldings from "@/components/VirtualHoldings";
import Watchlist from "@/components/Watchlist";
import PriceAlerts from "@/components/PriceAlerts";
import PortfolioResetButton from "@/components/PortfolioResetButton";

interface VirtualPortfolio {
  id: string;
  virtual_balance: number;
}

interface VirtualTrade {
  id: string;
  symbol: string;
  trade_type: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
}

interface VirtualOrder {
  id: string;
  symbol: string;
  order_type: string;
  quantity: number;
  limit_price: number;
  status: string;
}

interface Holding {
  symbol: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  totalValue: number;
  totalCost: number;
  profitLoss: number;
  profitLossPercent: number;
}

interface StockPrice {
  price: number;
  change: number;
  changePercent: number;
}

const VirtualTrading = () => {
  const navigate = useNavigate();
  const stockDetailRef = useRef<HTMLDivElement>(null);
  const [orderType, setOrderType] = useState("buy");
  const [quantity, setQuantity] = useState("");
  const [selectedStock, setSelectedStock] = useState("");
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<VirtualPortfolio | null>(null);
  const [recentTrades, setRecentTrades] = useState<VirtualTrade[]>([]);
  const [pendingOrders, setPendingOrders] = useState<VirtualOrder[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [realTimePrices, setRealTimePrices] = useState<Record<string, StockPrice>>({});
  const [watchlistKey, setWatchlistKey] = useState(0);

  const availableStocks = useMemo(() => [
    // Major Tech Stocks
    { symbol: "AAPL", name: "Apple Inc.", price: 182.52 },
    { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.38 },
    { symbol: "MSFT", name: "Microsoft Corp.", price: 415.45 },
    { symbol: "NVDA", name: "NVIDIA Corp.", price: 138.45 },
    
    // NASDAQ ETFs
    { symbol: "QQQ", name: "Invesco QQQ Trust (NASDAQ-100)", price: 485.32 },
    { symbol: "VGT", name: "Vanguard Information Technology ETF", price: 572.18 },
    { symbol: "VOOG", name: "Vanguard S&P 500 Growth ETF", price: 342.65 },
    { symbol: "VUG", name: "Vanguard Growth ETF", price: 358.42 },
    { symbol: "ARKK", name: "ARK Innovation ETF", price: 48.75 },
    { symbol: "SOXX", name: "iShares Semiconductor ETF", price: 525.80 },
    { symbol: "XLK", name: "Technology Select Sector SPDR", price: 228.45 },
    
    // Popular Mutual Funds (NAV prices)
    { symbol: "VFIAX", name: "Vanguard 500 Index Admiral", price: 458.32 },
    { symbol: "FXAIX", name: "Fidelity 500 Index", price: 185.67 },
    { symbol: "VTSAX", name: "Vanguard Total Stock Market Index", price: 128.45 },
    { symbol: "VIGAX", name: "Vanguard Growth Index Admiral", price: 168.92 },
    { symbol: "VGTSX", name: "Vanguard Total Intl Stock Index", price: 18.34 },
    
    // Bangladesh Stocks
    { symbol: "SQURPHARMA", name: "Square Pharma", price: 245.80 },
    { symbol: "GP", name: "Grameenphone", price: 325.60 },
  ], []);

  // Stock prices map for quick lookup
  const stockPrices: Record<string, number> = useMemo(() => ({
    // Tech Stocks
    AAPL: 182.52,
    GOOGL: 142.38,
    MSFT: 415.45,
    NVDA: 138.45,
    AMZN: 218.75,
    TSLA: 248.32,
    META: 612.89,
    
    // NASDAQ ETFs
    QQQ: 485.32,
    VGT: 572.18,
    VOOG: 342.65,
    VUG: 358.42,
    ARKK: 48.75,
    SOXX: 525.80,
    XLK: 228.45,
    
    // Mutual Funds
    VFIAX: 458.32,
    FXAIX: 185.67,
    VTSAX: 128.45,
    VIGAX: 168.92,
    VGTSX: 18.34,
    
    // Other Stocks
    JPM: 238.56,
    V: 322.15,
    WMT: 98.45,
    
    // Bangladesh Stocks
    SQURPHARMA: 245.80,
    GP: 325.60,
    BRACBANK: 48.25,
    BEXIMCO: 112.30,
    RENATA: 892.50,
    ACI: 185.40,
    OLYMPIC: 156.80,
    BATBC: 458.30,
    BSRMSTEEL: 68.45,
    LHBL: 95.80,
  }), []);

  const calculateHoldings = useCallback((trades: VirtualTrade[]) => {
    const holdingsMap = new Map<string, { quantity: number; totalCost: number }>();

    // Process all trades to calculate net positions
    trades.forEach(trade => {
      const existing = holdingsMap.get(trade.symbol) || { quantity: 0, totalCost: 0 };
      
      if (trade.trade_type === "BUY") {
        holdingsMap.set(trade.symbol, {
          quantity: existing.quantity + trade.quantity,
          totalCost: existing.totalCost + trade.total
        });
      } else if (trade.trade_type === "SELL") {
        // Calculate proportional cost to remove
        const avgCost = existing.quantity > 0 ? existing.totalCost / existing.quantity : 0;
        holdingsMap.set(trade.symbol, {
          quantity: existing.quantity - trade.quantity,
          totalCost: existing.totalCost - (avgCost * trade.quantity)
        });
      }
    });

    // Convert to holdings array with profit/loss calculations
    const holdingsArray: Holding[] = [];
    holdingsMap.forEach((data, symbol) => {
      if (data.quantity > 0) {
        // Use real-time price if available, otherwise fallback to static price
        const realtimePrice = realTimePrices[symbol]?.price;
        const currentPrice = realtimePrice || stockPrices[symbol] || 0;
        const avgCost = data.totalCost / data.quantity;
        const totalValue = currentPrice * data.quantity;
        const profitLoss = totalValue - data.totalCost;
        const profitLossPercent = (profitLoss / data.totalCost) * 100;

        console.log(`Holding ${symbol}:`, {
          quantity: data.quantity,
          currentPrice,
          totalValue,
          totalCost: data.totalCost,
          avgCost,
          profitLoss
        });

        holdingsArray.push({
          symbol,
          quantity: data.quantity,
          avgCost,
          currentPrice,
          totalValue,
          totalCost: data.totalCost,
          profitLoss,
          profitLossPercent
        });
      }
    });

    console.log('Total holdings calculated:', holdingsArray.length, 'Total value:', 
      holdingsArray.reduce((sum, h) => sum + h.totalValue, 0));

    setHoldings(holdingsArray);
  }, [realTimePrices, stockPrices]);

  const loadPortfolioData = useCallback(async (userId: string) => {
    try {
      // Load portfolio
      let portfolioData;
      const { data: initialPortfolioData, error: portfolioError } = await supabase
        .from("virtual_portfolios")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (portfolioError) throw portfolioError;
      
      // If no portfolio exists, create one with $10,000
      if (!initialPortfolioData) {
        const { data: newPortfolio, error: createError } = await supabase
          .from("virtual_portfolios")
          .insert({ user_id: userId, virtual_balance: 10000.00 })
          .select()
          .single();
        
        if (createError) throw createError;
        portfolioData = newPortfolio;
      } else {
        portfolioData = initialPortfolioData;
      }
      
      setPortfolio(portfolioData);

      // Load recent trades
      const { data: tradesData, error: tradesError } = await supabase
        .from("virtual_trades")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (tradesError) throw tradesError;
      setRecentTrades(tradesData || []);

      // Load pending orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("virtual_orders")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;
      setPendingOrders(ordersData || []);

      // Calculate holdings
      calculateHoldings(tradesData || []);
    } catch (error) {
      console.error("Error loading portfolio data:", error);
      toast.error("Failed to load portfolio data");
    } finally {
      setLoading(false);
    }
  }, [calculateHoldings]);

  const checkAuthAndLoadData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Please log in to access virtual trading");
      navigate("/auth");
      return;
    }

    await loadPortfolioData(session.user.id);
  }, [navigate, loadPortfolioData]);

  const fetchRealTimePrices = useCallback(async () => {
    try {
      // Get all unique symbols from holdings and available stocks
      const symbols = [...new Set([
        ...availableStocks.map(s => s.symbol),
        ...holdings.map(h => h.symbol)
      ])];
      
      // Get symbols from watchlist
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: watchlistData } = await supabase
          .from("watchlist")
          .select("symbol")
          .eq("user_id", session.user.id);
        const watchlistSymbols = watchlistData?.map(item => item.symbol) || [];
        symbols.push(...watchlistSymbols);
      }

      // Deduplicate again after adding watchlist symbols
      const uniqueSymbols = [...new Set(symbols)];

      const { data, error } = await supabase.functions.invoke('fetch-real-time-prices', {
        body: { symbols: uniqueSymbols }
      });

      if (error) throw error;
      
      if (data?.prices) {
        setRealTimePrices(data.prices);
        // Recalculate holdings with new prices
        if (recentTrades.length > 0) {
          calculateHoldings(recentTrades);
        }
      }
    } catch (error) {
      console.error('Error fetching real-time prices:', error);
      // Silently fail - use static prices as fallback
    }
  }, [availableStocks, holdings, recentTrades, calculateHoldings]);

  useEffect(() => {
    checkAuthAndLoadData();
    
    // Fetch real-time prices initially
    fetchRealTimePrices();
    
    // Update prices every 30 seconds
    const priceInterval = setInterval(() => {
      fetchRealTimePrices();
    }, 30000);
    
    return () => clearInterval(priceInterval);
  }, [checkAuthAndLoadData, fetchRealTimePrices]);

  // Refetch prices when watchlist changes
  useEffect(() => {
    fetchRealTimePrices();
  }, [watchlistKey, fetchRealTimePrices]);

  const handleStockSelect = (symbol: string) => {
    setSelectedStock(symbol);
    // Scroll to stock detail view after a short delay to allow render
    setTimeout(() => {
      if (stockDetailRef.current) {
        stockDetailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleTrade = async () => {
    if (!selectedStock || !quantity) {
      toast.error("Please fill in all fields");
      return;
    }

    const stock = availableStocks.find(s => s.symbol === selectedStock);
    if (!stock) return;

    // Use real-time price if available, otherwise fallback to static price
    const currentPrice = realTimePrices[selectedStock]?.price || stock.price;
    const total = currentPrice * parseFloat(quantity);
    
    if (orderType === "buy" && portfolio && total > portfolio.virtual_balance) {
      toast.error("Insufficient virtual balance");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Insert trade
      const { error: tradeError } = await supabase
        .from("virtual_trades")
        .insert({
          user_id: session.user.id,
          symbol: selectedStock,
          trade_type: orderType.toUpperCase(),
          quantity: parseInt(quantity),
          price: currentPrice,
          total: total
        });

      if (tradeError) throw tradeError;

      // Update portfolio balance
      if (portfolio) {
        const newBalance = orderType === "buy" 
          ? portfolio.virtual_balance - total
          : portfolio.virtual_balance + total;

        const { error: updateError } = await supabase
          .from("virtual_portfolios")
          .update({ virtual_balance: newBalance })
          .eq("id", portfolio.id);

        if (updateError) throw updateError;
      }

      toast.success(
        `Virtual ${orderType.toUpperCase()} order placed: ${quantity} shares of ${selectedStock} at $${currentPrice.toFixed(2)}`,
        {
          description: `Total: $${total.toFixed(2)}`,
        }
      );

      setQuantity("");
      setSelectedStock("");
      
      // Reload data
      await loadPortfolioData(session.user.id);
    } catch (error) {
      console.error("Error placing trade:", error);
      toast.error("Failed to place trade");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading your virtual trading dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-foreground">
                Virtual Trading
              </h1>
              <p className="text-muted-foreground">Practice trading with virtual money - no risk involved</p>
            </div>
            <PortfolioResetButton onReset={() => {
              checkAuthAndLoadData();
            }} />
          </div>
        </header>

        {/* Portfolio Performance Chart */}
        <div className="mb-8">
          <VirtualPortfolioChart />
        </div>

        {/* Current Holdings */}
        <div className="mb-8">
          <VirtualHoldings 
            holdings={holdings} 
            onStockClick={handleStockSelect}
            virtualBalance={portfolio?.virtual_balance || 10000}
          />
        </div>

        {/* Stock Detail View */}
        {selectedStock && (
          <div ref={stockDetailRef} className="mb-8">
            <StockDetailView 
              symbol={selectedStock}
              onBuyClick={() => {
                setOrderType("buy");
                // Scroll to order form
                const formElement = document.querySelector('[data-order-form]');
                if (formElement) {
                  window.scrollTo({ 
                    top: formElement.getBoundingClientRect().top + window.scrollY - 100,
                    behavior: "smooth" 
                  });
                }
              }}
              onSellClick={() => {
                setOrderType("sell");
                // Scroll to order form
                const formElement = document.querySelector('[data-order-form]');
                if (formElement) {
                  window.scrollTo({ 
                    top: formElement.getBoundingClientRect().top + window.scrollY - 100,
                    behavior: "smooth" 
                  });
                }
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2" data-order-form>
            <CardHeader>
              <CardTitle>Place Virtual Order</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={orderType} onValueChange={setOrderType}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="buy">Buy</TabsTrigger>
                  <TabsTrigger value="sell">Sell</TabsTrigger>
                </TabsList>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="search-stock">Search Stock</Label>
                    <StockSearchBar 
                      onSelectStock={handleStockSelect}
                      onWatchlistUpdate={() => setWatchlistKey(prev => prev + 1)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="stock">Or Select from Popular Stocks</Label>
                    <Select value={selectedStock} onValueChange={setSelectedStock}>
                      <SelectTrigger id="stock">
                        <SelectValue placeholder="Choose a stock" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStocks.map((stock) => {
                          const realtimePrice = realTimePrices[stock.symbol]?.price || stock.price;
                          return (
                            <SelectItem key={stock.symbol} value={stock.symbol}>
                              {stock.symbol} - {stock.name} (${realtimePrice.toFixed(2)})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="Number of shares"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      min="1"
                    />
                  </div>

                  {selectedStock && quantity && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Estimated Total:</span>
                        <span className="text-lg font-bold">
                          ${(
                            (availableStocks.find(s => s.symbol === selectedStock)?.price || 0) * 
                            parseFloat(quantity)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleTrade} 
                    className="w-full"
                    variant={orderType === "buy" ? "default" : "destructive"}
                  >
                    Place {orderType.toUpperCase()} Order
                  </Button>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Virtual Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  <span>Virtual Balance</span>
                </div>
                <p className="text-3xl font-bold text-accent">
                  ${portfolio?.virtual_balance.toLocaleString() || "0"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span>Today's P&L</span>
                </div>
                <p className="text-2xl font-bold text-accent">
                  +$1,234.56
                </p>
                <p className="text-sm text-accent">+2.8%</p>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  ⚠️ This is virtual trading. No real money is involved. Perfect for learning and testing strategies!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Watchlist and Price Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Watchlist
            key={watchlistKey}
            onStockClick={handleStockSelect}
            onWatchlistUpdate={() => setWatchlistKey(prev => prev + 1)}
          />
          <PriceAlerts stockPrices={realTimePrices} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Recent Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTrades.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No trades yet. Start trading to see your history here!</p>
                ) : (
                  recentTrades.map((trade) => (
                    <button
                      key={trade.id}
                      onClick={() => handleStockSelect(trade.symbol)}
                      className="w-full flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                    >
                      <div className="text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 text-xs font-bold rounded ${
                            trade.trade_type === "BUY" ? "bg-accent/20 text-accent" : "bg-destructive/20 text-destructive"
                          }`}>
                            {trade.trade_type}
                          </span>
                          <span className="font-bold hover:text-primary transition-colors">{trade.symbol}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {trade.quantity} shares @ ${trade.price}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(trade.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${trade.total.toFixed(2)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pending Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No pending orders</p>
                ) : (
                  pendingOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 text-xs font-bold rounded ${
                            order.order_type === "BUY" ? "bg-accent/20 text-accent" : "bg-destructive/20 text-destructive"
                          }`}>
                            {order.order_type}
                          </span>
                          <span className="font-bold">{order.symbol}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.quantity} shares @ ${order.limit_price}
                        </p>
                        <p className="text-xs text-primary">{order.status}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Cancel
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default VirtualTrading;
