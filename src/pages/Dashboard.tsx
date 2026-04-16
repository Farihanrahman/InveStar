import { PageLayout } from "@/components/layout";
import MarketCard from "@/components/MarketCard";
import StockDetailModal from "@/components/StockDetailModal";
import LimitOrderDialog from "@/components/LimitOrderDialog";
import { TradeDialog } from "@/components/trading";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, RefreshCw, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useConfetti } from "@/hooks/useConfetti";
import WelcomeHeader from "@/components/WelcomeHeader";
import AuthRequired from "@/components/AuthRequired";

import { useRealTimePrices, getStockPriceData } from "@/hooks/useRealTimePrices";
import {
  DSE_MARKET_DATA,
  US_MARKET_DATA,
  CRYPTO_MARKET_DATA,
  FOREX_MARKET_DATA,
  ALL_MARKET_SYMBOLS,
  findStockInfo,
} from "@/lib/constants/marketData";

interface SelectedStock {
  symbol: string;
  name: string;
  isBDT: boolean;
  currentPrice?: number;
}

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'dse';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<SelectedStock | null>(null);
  
  // Trade dialog state
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [tradeSymbol, setTradeSymbol] = useState("");
  const [tradeShares, setTradeShares] = useState("");
  // Use OMS auth instead of Supabase auth
  const { isAuthenticated, user: omsUser } = useOmsAuth();
  const userId = omsUser?.id?.toString() || null;

  // Limit order dialog state
  const [limitOrderOpen, setLimitOrderOpen] = useState(false);
  const [limitOrderSymbol, setLimitOrderSymbol] = useState("");
  const [limitOrderPrice, setLimitOrderPrice] = useState<number | undefined>(undefined);

  const { triggerConfetti } = useConfetti();

  // Use shared real-time prices hook
  const { prices: realTimePrices, lastUpdated, isLoading, refresh: fetchRealTimePrices } = useRealTimePrices({
    symbols: ALL_MARKET_SYMBOLS,
    refreshInterval: 30000,
    enabled: true,
  });

  // Authentication is now handled by useOmsAuth hook

  const getStockData = (stock: { symbol: string; name: string; basePrice: number; baseChange: number }, isBDT = false) => {
    const priceData = getStockPriceData(stock.symbol, realTimePrices, stock.basePrice, stock.baseChange, isBDT);
    
    return {
      symbol: stock.symbol,
      name: stock.name,
      price: priceData.formattedPrice,
      change: priceData.formattedChange,
      changePercent: priceData.formattedChangePercent,
      isPositive: priceData.isPositive,
      rawPrice: priceData.price,
    };
  };

  const handleStockClick = (symbol: string, name: string, isBDT: boolean, currentPrice?: number) => {
    setSelectedStock({ symbol, name, isBDT, currentPrice });
  };

  const openBuyDialog = (symbol?: string) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to trade");
      return;
    }
    setTradeType("buy");
    setTradeSymbol(symbol || "");
    setTradeDialogOpen(true);
  };

  const openSellDialog = (symbol?: string) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to trade");
      return;
    }
    setTradeType("sell");
    setTradeSymbol(symbol || "");
    setTradeDialogOpen(true);
  };

  const openLimitOrderDialog = (symbol?: string, price?: number) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to place limit orders");
      return;
    }
    setLimitOrderSymbol(symbol || "");
    setLimitOrderPrice(price);
    setLimitOrderOpen(true);
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
    
    const stockInfo = findStockInfo(tradeSymbol);
    const rtPrice = realTimePrices[tradeSymbol];
    const currentPrice = rtPrice?.price ?? stockInfo?.basePrice ?? 100;
    const total = currentPrice * shares;
    
    // Get existing holding
    const { data: existingHolding } = await supabase
      .from('portfolio_holdings')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', tradeSymbol)
      .maybeSingle();
    
    if (tradeType === "buy") {
      await supabase.from('portfolio_transactions').insert({
        user_id: userId,
        symbol: tradeSymbol,
        name: stockInfo?.name || tradeSymbol,
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
          .eq('symbol', tradeSymbol);
      } else {
        await supabase.from('portfolio_holdings').insert({
          user_id: userId,
          symbol: tradeSymbol,
          name: stockInfo?.name || tradeSymbol,
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
      
      if (shares > Number(existingHolding.shares)) {
        toast.error(`You only own ${existingHolding.shares} shares of ${tradeSymbol}`);
        return;
      }
      
      await supabase.from('portfolio_transactions').insert({
        user_id: userId,
        symbol: tradeSymbol,
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
          .eq('symbol', tradeSymbol);
      } else {
        await supabase.from('portfolio_holdings')
          .update({ shares: Number(existingHolding.shares) - shares })
          .eq('user_id', userId)
          .eq('symbol', tradeSymbol);
      }
      toast.success(`Sold ${shares} shares of ${tradeSymbol} at $${currentPrice.toFixed(2)}`);
      triggerConfetti('sell');
    }
    
    setTradeSymbol("");
    setTradeShares("");
    setTradeDialogOpen(false);
  };

  // Memoized filtered data
  const filteredDseData = useMemo(() => 
    DSE_MARKET_DATA.filter(stock => 
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [searchQuery]);

  const filteredUsData = useMemo(() => 
    US_MARKET_DATA.filter(stock => 
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [searchQuery]);

  const filteredCryptoData = useMemo(() => 
    CRYPTO_MARKET_DATA.filter(stock => 
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [searchQuery]);

  const filteredForexData = useMemo(() => 
    FOREX_MARKET_DATA.filter(stock => 
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [searchQuery]);

  return (
    <PageLayout>
      <AuthRequired pageName="Markets">
        <WelcomeHeader />
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-foreground">
                Market Overview
              </h1>
              <p className="text-muted-foreground">
                Track real-time market data across global exchanges
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
                onClick={() => openSellDialog()}
              >
                <TrendingDown className="w-4 h-4" />
                Sell
              </Button>
              <Button 
                variant="outline"
                className="gap-2 border-primary/50"
                onClick={() => openLimitOrderDialog()}
              >
                <Clock className="w-4 h-4" />
                Limit Order
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

        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Search stocks, indices..."
              className="pl-10 bg-card border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-8">
            <TabsTrigger value="dse">DSE</TabsTrigger>
            <TabsTrigger value="us">US Markets</TabsTrigger>
            <TabsTrigger value="crypto">Crypto</TabsTrigger>
            <TabsTrigger value="forex">Forex</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dse" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDseData.map((stock) => {
                const stockData = getStockData(stock, true);
                return (
                  <MarketCard 
                    key={stock.symbol} 
                    {...stockData} 
                    onClick={() => handleStockClick(stock.symbol, stock.name, true, stockData.rawPrice)}
                    onBuy={(symbol) => openBuyDialog(symbol)}
                    onSell={(symbol) => openSellDialog(symbol)}
                    onLimitOrder={(symbol, price) => openLimitOrderDialog(symbol, price)}
                  />
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="us" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsData.map((stock) => {
                const stockData = getStockData(stock, false);
                return (
                  <MarketCard 
                    key={stock.symbol} 
                    {...stockData} 
                    onClick={() => handleStockClick(stock.symbol, stock.name, false, stockData.rawPrice)}
                    onBuy={(symbol) => openBuyDialog(symbol)}
                    onSell={(symbol) => openSellDialog(symbol)}
                    onLimitOrder={(symbol, price) => openLimitOrderDialog(symbol, price)}
                  />
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="crypto" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCryptoData.map((stock) => {
                const stockData = getStockData(stock, false);
                return (
                  <MarketCard 
                    key={stock.symbol} 
                    {...stockData} 
                    onClick={() => handleStockClick(stock.symbol, stock.name, false, stockData.rawPrice)}
                    onBuy={(symbol) => openBuyDialog(symbol)}
                    onSell={(symbol) => openSellDialog(symbol)}
                    onLimitOrder={(symbol, price) => openLimitOrderDialog(symbol, price)}
                  />
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="forex" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredForexData.map((stock) => {
                const stockData = getStockData(stock, false);
                return (
                  <MarketCard 
                    key={stock.symbol} 
                    {...stockData} 
                    onClick={() => handleStockClick(stock.symbol, stock.name, false, stockData.rawPrice)}
                    onBuy={(symbol) => openBuyDialog(symbol)}
                    onSell={(symbol) => openSellDialog(symbol)}
                    onLimitOrder={(symbol, price) => openLimitOrderDialog(symbol, price)}
                  />
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </AuthRequired>

      {/* Stock Detail Modal */}
      {selectedStock && (
        <StockDetailModal
          symbol={selectedStock.symbol}
          name={selectedStock.name}
          isOpen={!!selectedStock}
          onClose={() => setSelectedStock(null)}
          isBDT={selectedStock.isBDT}
          initialPrice={selectedStock.currentPrice}
        />
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
      />

      {/* Limit Order Dialog */}
      <LimitOrderDialog
        isOpen={limitOrderOpen}
        onClose={() => setLimitOrderOpen(false)}
        symbol={limitOrderSymbol}
        currentPrice={limitOrderPrice}
      />

    </PageLayout>
  );
};

export default Dashboard;
