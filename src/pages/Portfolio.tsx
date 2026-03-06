import { PageLayout } from "@/components/layout";
import { TradeDialog } from "@/components/trading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, RefreshCw, Search, TrendingUp, TrendingDown, BarChart3, PieChart, GraduationCap, History, DollarSign, Bell, Sparkles } from "lucide-react";
import StockDetailView from "@/components/StockDetailView";
import Watchlist from "@/components/Watchlist";
import StockSearchBar from "@/components/StockSearchBar";
import PriceAlerts from "@/components/PriceAlerts";
import PortfolioAllocationChart from "@/components/PortfolioAllocationChart";
import WelcomeHeader from "@/components/WelcomeHeader";
import AuthRequired from "@/components/AuthRequired";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useConfetti } from "@/hooks/useConfetti";
import { StockPrice } from "@/hooks/useRealTimePrices";

interface Holding {
  id?: string;
  symbol: string;
  name: string;
  shares: number;
  avg_cost: number;
}

interface Transaction {
  id: string;
  symbol: string;
  name: string | null;
  transaction_type: string;
  shares: number;
  price: number;
  total: number;
  created_at: string;
}

const Portfolio = () => {
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [realTimePrices, setRealTimePrices] = useState<Record<string, StockPrice>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // Use OMS auth instead of Supabase auth
  const { isAuthenticated, user: omsUser } = useOmsAuth();
  const userId = omsUser?.id?.toString() || null;

  const { triggerConfetti } = useConfetti();
  
  // Form states
  const [newSymbol, setNewSymbol] = useState("");
  const [newName, setNewName] = useState("");
  const [newShares, setNewShares] = useState("");
  const [newAvgCost, setNewAvgCost] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [tradeSymbol, setTradeSymbol] = useState("");
  const [tradeShares, setTradeShares] = useState("");
  const [qtype, setQtype] = useState("Market");
  const [validity, setValidity] = useState("Day");
  const [dispQty, setDispQty] = useState("");
  const [watchlistRefreshKey, setWatchlistRefreshKey] = useState(0);
  const [remitInvestBalance, setRemitInvestBalance] = useState(0);

  // Load remit invest balance from localStorage
  useEffect(() => {
    const stored = parseFloat(localStorage.getItem("remit_invest_balance") || "0");
    setRemitInvestBalance(stored);
  }, []);
  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated && userId) {
      loadHoldings(userId);
      loadTransactions(userId);
    }
  }, [isAuthenticated, userId]);

  const loadHoldings = async (uid: string) => {
    const { data, error } = await supabase
      .from('portfolio_holdings')
      .select('*')
      .eq('user_id', uid);
    
    if (!error && data) {
      setHoldings(data.map(h => ({
        id: h.id,
        symbol: h.symbol,
        name: h.name,
        shares: Number(h.shares),
        avg_cost: Number(h.avg_cost)
      })));
    }
  };

  const loadTransactions = async (uid: string) => {
    const { data, error } = await supabase
      .from('portfolio_transactions')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!error && data) {
      setTransactions(data.map(t => ({
        ...t,
        shares: Number(t.shares),
        price: Number(t.price),
        total: Number(t.total)
      })));
    }
  };

  const fetchRealTimePrices = async () => {
    setIsLoading(true);
    try {
      // Get symbols from holdings
      const holdingSymbols = holdings.map(h => h.symbol);
      
      // Get symbols from watchlist
      let watchlistSymbols: string[] = [];
      if (isAuthenticated && userId) {
        const { data: watchlistData } = await supabase
          .from("watchlist")
          .select("symbol")
          .eq("user_id", userId);
        watchlistSymbols = watchlistData?.map(item => item.symbol) || [];
      }
      
      // Combine and deduplicate symbols
      const symbols = [...new Set([...holdingSymbols, ...watchlistSymbols])];
      
      if (symbols.length === 0) {
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('fetch-real-time-prices', {
        body: { symbols }
      });

      if (error) throw error;
      
      if (data?.prices) {
        setRealTimePrices(data.prices);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching real-time prices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchRealTimePrices();
      const interval = setInterval(fetchRealTimePrices, 30000);
      return () => clearInterval(interval);
    }
  }, [holdings, isAuthenticated, userId, watchlistRefreshKey]);

  const getHoldingData = (holding: Holding) => {
    const rtPrice = realTimePrices[holding.symbol];
    const currentPrice = rtPrice?.price ?? (holding.avg_cost * 1.05);
    const totalValue = currentPrice * holding.shares;
    const totalCost = holding.avg_cost * holding.shares;
    const returnValue = ((currentPrice - holding.avg_cost) / holding.avg_cost) * 100;
    const gainLoss = totalValue - totalCost;
    
    return {
      symbol: holding.symbol,
      name: holding.name,
      shares: holding.shares,
      avgCost: holding.avg_cost,
      currentPrice,
      totalValue,
      totalCost,
      returnPercent: returnValue,
      gainLoss,
      isPositive: returnValue >= 0,
    };
  };

  const holdingsData = holdings.map(getHoldingData);
  
  const filteredHoldings = holdingsData.filter(h => 
    h.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate totals
  const totalValue = holdingsData.reduce((sum, h) => sum + h.totalValue, 0);
  const totalCost = holdingsData.reduce((sum, h) => sum + h.totalCost, 0);
  const totalGainLoss = totalValue - totalCost;
  const totalReturnPercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  const handleAddPosition = async () => {
    if (!isAuthenticated || !userId) {
      toast.error("Please sign in to add positions");
      return;
    }
    if (!newSymbol || !newName || !newShares || !newAvgCost) {
      toast.error("Please fill in all fields");
      return;
    }
    
    const shares = parseFloat(newShares);
    const avgCost = parseFloat(newAvgCost);
    
    if (isNaN(shares) || isNaN(avgCost) || shares <= 0 || avgCost <= 0) {
      toast.error("Please enter valid numbers");
      return;
    }
    
    const { error } = await supabase
      .from('portfolio_holdings')
      .upsert({
        user_id: userId,
        symbol: newSymbol.toUpperCase(),
        name: newName,
        shares,
        avg_cost: avgCost
      }, { onConflict: 'user_id,symbol' });

    if (error) {
      toast.error("Failed to add position");
      return;
    }
    
    await loadHoldings(userId);
    setNewSymbol("");
    setNewName("");
    setNewShares("");
    setNewAvgCost("");
    setAddDialogOpen(false);
    toast.success(`Added ${newSymbol.toUpperCase()} to portfolio`);
  };

  const handleTrade = async () => {
    if (!isAuthenticated || !userId) {
      toast.error("Please sign in to trade");
      return;
    }
    if (!tradeSymbol || !tradeShares) {
      toast.error("Please fill in all fields");
      return;
    }
    
    const shares = parseFloat(tradeShares);
    if (isNaN(shares) || shares <= 0) {
      toast.error("Please enter a valid number of shares");
      return;
    }
    
    const rtPrice = realTimePrices[tradeSymbol];
    const currentPrice = rtPrice?.price ?? 100;
    const total = currentPrice * shares;
    
    const existingHolding = holdings.find(h => h.symbol === tradeSymbol);
    
    if (tradeType === "buy") {
      // Record transaction
      await supabase.from('portfolio_transactions').insert({
        user_id: userId,
        symbol: tradeSymbol,
        name: existingHolding?.name || tradeSymbol,
        transaction_type: 'buy',
        shares,
        price: currentPrice,
        total
      });

      if (existingHolding) {
        const newShares = existingHolding.shares + shares;
        const newAvgCost = ((existingHolding.shares * existingHolding.avg_cost) + (shares * currentPrice)) / newShares;
        
        await supabase.from('portfolio_holdings')
          .update({ shares: newShares, avg_cost: newAvgCost })
          .eq('user_id', userId)
          .eq('symbol', tradeSymbol);
      } else {
        await supabase.from('portfolio_holdings').insert({
          user_id: userId,
          symbol: tradeSymbol,
          name: tradeSymbol,
          shares,
          avg_cost: currentPrice
        });
      }
      toast.success(`Bought ${shares} shares of ${tradeSymbol} at $${currentPrice.toFixed(2)}`);
      triggerConfetti('buy');
    } else {
      if (!existingHolding) {
        toast.error(`You don't own any ${tradeSymbol}`);
        return;
      }
      
      if (shares > existingHolding.shares) {
        toast.error(`You only own ${existingHolding.shares} shares of ${tradeSymbol}`);
        return;
      }
      
      // Record transaction
      await supabase.from('portfolio_transactions').insert({
        user_id: userId,
        symbol: tradeSymbol,
        name: existingHolding.name,
        transaction_type: 'sell',
        shares,
        price: currentPrice,
        total
      });

      if (shares === existingHolding.shares) {
        await supabase.from('portfolio_holdings')
          .delete()
          .eq('user_id', userId)
          .eq('symbol', tradeSymbol);
      } else {
        await supabase.from('portfolio_holdings')
          .update({ shares: existingHolding.shares - shares })
          .eq('user_id', userId)
          .eq('symbol', tradeSymbol);
      }
      toast.success(`Sold ${shares} shares of ${tradeSymbol} at $${currentPrice.toFixed(2)}`);
      triggerConfetti('sell');
    }
    
    await loadHoldings(userId);
    await loadTransactions(userId);
    setTradeSymbol("");
    setTradeShares("");
    setQtype("Market");
    setValidity("Day");
    setDispQty("");
    setTradeDialogOpen(false);
  };

  const openBuyDialog = (symbol?: string) => {
    setTradeType("buy");
    setTradeSymbol(symbol || "");
    setTradeDialogOpen(true);
  };

  const openSellDialog = (symbol: string) => {
    setTradeType("sell");
    setTradeSymbol(symbol);
    setTradeDialogOpen(true);
  };

  return (
    <PageLayout>
        <AuthRequired pageName="your Portfolio">
        <WelcomeHeader />
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Portfolio
              </h1>
              <p className="text-muted-foreground">
                Track your investments and performance
                {lastUpdated && (
                  <span className="ml-2 text-xs">
                    • Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                className="gap-2 bg-green-600 hover:bg-green-700"
                onClick={() => openBuyDialog()}
              >
                <TrendingUp className="w-4 h-4" />
                Buy
              </Button>
              <Button 
                className="gap-2 bg-red-600 hover:bg-red-700"
                onClick={() => openSellDialog("")}
              >
                <TrendingDown className="w-4 h-4" />
                Sell
              </Button>
              <Button 
                variant="outline" 
                size="default" 
                onClick={fetchRealTimePrices}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        {/* Remittance Investment Balance Banner */}
        {remitInvestBalance > 0 && (
          <Card className="mb-6 border-2 border-green-500/30 bg-gradient-to-r from-green-500/10 to-accent/10 animate-in fade-in slide-in-from-top-4 duration-500">
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/20">
                  <Sparkles className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available from Remittance Investment</p>
                  <p className="text-3xl font-bold text-green-500">${remitInvestBalance.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Set aside from your Send Money transfers · Ready to invest
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => {
                    openBuyDialog();
                    toast.success(`You have $${remitInvestBalance.toFixed(2)} available to invest from remittances`);
                  }}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Invest Now
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    localStorage.removeItem("remit_invest_balance");
                    setRemitInvestBalance(0);
                    toast.info("Investment balance cleared");
                  }}
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/20">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl font-bold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-accent/20">
                  <PieChart className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={`bg-gradient-to-br ${totalGainLoss >= 0 ? 'from-green-500/10 to-green-500/5' : 'from-red-500/10 to-red-500/5'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${totalGainLoss >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  {totalGainLoss >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gain/Loss</p>
                  <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {totalGainLoss >= 0 ? '+' : ''}{totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={`bg-gradient-to-br ${totalReturnPercent >= 0 ? 'from-green-500/10 to-green-500/5' : 'from-red-500/10 to-red-500/5'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${totalReturnPercent >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  <BarChart3 className={`w-6 h-6 ${totalReturnPercent >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Return %</p>
                  <p className={`text-2xl font-bold ${totalReturnPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {totalReturnPercent >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link to="/virtual-trading">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardContent className="flex items-center gap-3 p-4">
                <BarChart3 className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-semibold">Virtual Trading</p>
                  <p className="text-xs text-muted-foreground">Practice trading</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/net-worth">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardContent className="flex items-center gap-3 p-4">
                <PieChart className="w-8 h-8 text-accent" />
                <div>
                  <p className="font-semibold">Net Worth</p>
                  <p className="text-xs text-muted-foreground">Track wealth</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/dashboard">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardContent className="flex items-center gap-3 p-4">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div>
                  <p className="font-semibold">Markets</p>
                  <p className="text-xs text-muted-foreground">View stocks</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <a href="https://investarbd.com/learning-platform/" target="_blank" rel="noopener noreferrer">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardContent className="flex items-center gap-3 p-4">
                <GraduationCap className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="font-semibold">InveStar University</p>
                  <p className="text-xs text-muted-foreground">Learn to invest</p>
                </div>
              </CardContent>
            </Card>
          </a>
        </div>

        {/* Portfolio Allocation Chart */}
        <div className="mb-8">
          <PortfolioAllocationChart 
            holdings={holdingsData.map(h => ({
              symbol: h.symbol,
              name: h.name,
              totalValue: h.totalValue,
              returnPercent: h.returnPercent,
              isPositive: h.isPositive,
            }))}
            totalValue={totalValue}
          />
        </div>

        {/* Watchlist with Search Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add to Watchlist</CardTitle>
              </CardHeader>
              <CardContent>
                <StockSearchBar 
                  onSelectStock={(symbol) => setSelectedStock(symbol)}
                  onWatchlistUpdate={() => setWatchlistRefreshKey(prev => prev + 1)}
                />
              </CardContent>
            </Card>
            <Watchlist 
              key={watchlistRefreshKey}
              onStockClick={(symbol) => setSelectedStock(symbol)} 
              onWatchlistUpdate={() => setWatchlistRefreshKey(prev => prev + 1)}
            />
          </div>
          
          {/* Price Alerts */}
          <PriceAlerts stockPrices={realTimePrices} />
        </div>

        {selectedStock && (
          <div className="mb-8">
            <StockDetailView symbol={selectedStock} />
          </div>
        )}

        {/* Holdings Table */}
        <Card className="mb-8">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Holdings</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search holdings..."
                  className="pl-9 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Button 
                variant="default" 
                className="gap-2 bg-green-600 hover:bg-green-700"
                onClick={() => openBuyDialog()}
              >
                <TrendingUp className="w-4 h-4" />
                Buy
              </Button>
              
              <Button 
                variant="default" 
                className="gap-2 bg-red-600 hover:bg-red-700"
                onClick={() => {
                  setTradeType("sell");
                  setTradeDialogOpen(true);
                }}
              >
                <TrendingDown className="w-4 h-4" />
                Sell
              </Button>
              
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Position
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Position</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="symbol">Stock Symbol</Label>
                      <Input 
                        id="symbol" 
                        placeholder="e.g., AAPL" 
                        value={newSymbol}
                        onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Company Name</Label>
                      <Input 
                        id="name" 
                        placeholder="e.g., Apple Inc." 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="shares">Number of Shares</Label>
                        <Input 
                          id="shares" 
                          type="number" 
                          placeholder="0"
                          value={newShares}
                          onChange={(e) => setNewShares(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="avgCost">Average Cost ($)</Label>
                        <Input 
                          id="avgCost" 
                          type="number" 
                          step="0.01"
                          placeholder="0.00"
                          value={newAvgCost}
                          onChange={(e) => setNewAvgCost(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleAddPosition}>Add Position</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Symbol</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Shares</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Avg Cost</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Current</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Value</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Gain/Loss</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!isAuthenticated ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to view your portfolio
                      </td>
                    </tr>
                  ) : filteredHoldings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        {searchQuery ? "No holdings match your search" : "No holdings yet. Add a position to get started."}
                      </td>
                    </tr>
                  ) : (
                    filteredHoldings.map((holding) => (
                      <tr 
                        key={holding.symbol} 
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td 
                          className="py-4 px-4 font-bold cursor-pointer hover:text-primary"
                          onClick={() => setSelectedStock(holding.symbol)}
                        >
                          {holding.symbol}
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">{holding.name}</td>
                        <td className="py-4 px-4 text-right">{holding.shares}</td>
                        <td className="py-4 px-4 text-right">${holding.avgCost.toFixed(2)}</td>
                        <td className="py-4 px-4 text-right">${holding.currentPrice.toFixed(2)}</td>
                        <td className="py-4 px-4 text-right font-medium">${holding.totalValue.toFixed(2)}</td>
                        <td className={`py-4 px-4 text-right font-medium ${holding.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {holding.isPositive ? '+' : ''}{holding.gainLoss.toFixed(2)} ({holding.returnPercent.toFixed(2)}%)
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-green-500 border-green-500 hover:bg-green-500 hover:text-white"
                              onClick={() => openBuyDialog(holding.symbol)}
                            >
                              Buy
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                              onClick={() => openSellDialog(holding.symbol)}
                            >
                              Sell
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        {isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Symbol</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Shares</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Price</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          No transactions yet. Start trading to see your history.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-4 px-4 text-sm">
                            {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              tx.transaction_type === 'buy' 
                                ? 'bg-green-500/20 text-green-500' 
                                : 'bg-red-500/20 text-red-500'
                            }`}>
                              {tx.transaction_type.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-bold">{tx.symbol}</td>
                          <td className="py-4 px-4 text-right">{tx.shares}</td>
                          <td className="py-4 px-4 text-right">${tx.price.toFixed(2)}</td>
                          <td className="py-4 px-4 text-right font-medium">${tx.total.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Trade Dialog - Using shared component */}
        <TradeDialog
          open={tradeDialogOpen}
          onOpenChange={setTradeDialogOpen}
          tradeType={tradeType}
          symbol={tradeSymbol}
          onSymbolChange={setTradeSymbol}
          shares={tradeShares}
          onSharesChange={setTradeShares}
          onSubmit={handleTrade}
          showAdvancedOptions={true}
          qtype={qtype}
          onQtypeChange={setQtype}
          validity={validity}
          onValidityChange={setValidity}
          dispQty={dispQty}
          onDispQtyChange={setDispQty}
        />
        </AuthRequired>
    </PageLayout>
  );
};

export default Portfolio;
