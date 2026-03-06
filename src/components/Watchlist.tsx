import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Trash2, TrendingUp, TrendingDown, MoreVertical, Layout, Grid } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LimitOrderDialog from "./LimitOrderDialog";
import MarketCard from "@/components/MarketCard";
import { OmsTradeDialog } from "@/components/trading";
import { useTradeInformationsBySecurities, type WatchlistSecurityItem } from "@/hooks/api/useDashboardApi";

interface WatchlistProps {
  onStockClick: (symbol: string) => void;
  onWatchlistUpdate?: () => void;
}

const WATCHLIST_STORAGE_KEY = 'oms_watchlist';

const getStoredWatchlist = (userId: string): WatchlistSecurityItem[] => {
  try {
    const stored = localStorage.getItem(`${WATCHLIST_STORAGE_KEY}_${userId}`);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    // Handle migration from old format (array of strings) to new format (array of objects)
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (typeof parsed[0] === 'string') {
        // Old format: ["SYMBOL1", "SYMBOL2"] - migrate to new format
        const migrated = parsed.map((code: string) => ({
          securityCode: code,
          securitySubType: 'PUBLIC' // Default to PUBLIC for legacy items
        }));
        // Save migrated data
        localStorage.setItem(`${WATCHLIST_STORAGE_KEY}_${userId}`, JSON.stringify(migrated));
        return migrated;
      }
      // New format: [{ securityCode, securitySubType }]
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
};

const setStoredWatchlist = (userId: string, items: WatchlistSecurityItem[]) => {
  localStorage.setItem(`${WATCHLIST_STORAGE_KEY}_${userId}`, JSON.stringify(items));
};

const Watchlist = ({ onStockClick, onWatchlistUpdate }: WatchlistProps) => {
  const { isAuthenticated, user: omsUser } = useOmsAuth();
  const userId = omsUser?.id?.toString() || null;
  const [watchlistItems, setWatchlistItems] = useState<WatchlistSecurityItem[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Limit order dialog state
  const [limitOrderOpen, setLimitOrderOpen] = useState(false);
  const [limitOrderSymbol, setLimitOrderSymbol] = useState("");
  const [limitOrderPrice, setLimitOrderPrice] = useState<number | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'compact' | 'card'>(() => {
    const saved = localStorage.getItem('watchlist-view-mode');
    return (saved as 'compact' | 'card') || 'compact';
  });

  // OMS Trade Dialog state
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>(undefined);
  const [selectedSecuritySubType, setSelectedSecuritySubType] = useState("PUBLIC");

  // Fetch trade informations for watchlist items
  const { data: tradeInfoData, isLoading } = useTradeInformationsBySecurities(
    watchlistItems,
    { page: 1, size: 1000, sort: 'tradeDate,desc' }
  );

  // Parse the API response
  const tradeInfoItems = useMemo(() => {
    const apiData = (tradeInfoData as { data?: Array<{
      securityCode: string;
      companyName: string;
      ltp: number;
      closingPrice: number;
      openingPrice: number;
      securitySubType: string;
    }> })?.data;
    
    // Map to include calculated price change (0 if openingPrice is null)
    return (apiData || []).map(item => ({
      ...item,
      priceChange: item.openingPrice != null ? item.openingPrice - (item.closingPrice || 0) : 0,
      priceChangePercent: item.openingPrice != null && item.closingPrice != null && item.closingPrice !== 0 
        ? ((item.openingPrice - item.closingPrice) / item.closingPrice) * 100 
        : 0
    }));
  }, [tradeInfoData]);

  const handleSetViewMode = (mode: 'compact' | 'card') => {
    setViewMode(mode);
    localStorage.setItem('watchlist-view-mode', mode);
  };

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchWatchlist();
    }
  }, [isAuthenticated, userId, refreshKey]);

  // Listen for watchlist updates from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `${WATCHLIST_STORAGE_KEY}_${userId}`) {
        fetchWatchlist();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userId]);

  const fetchWatchlist = () => {
    if (!userId) return;
    const items = getStoredWatchlist(userId);
    setWatchlistItems(items);
  };

  const removeFromWatchlist = (securityCode: string) => {
    if (!userId) return;
    
    try {
      const updatedWatchlist = watchlistItems.filter(item => item.securityCode !== securityCode);
      setStoredWatchlist(userId, updatedWatchlist);
      setWatchlistItems(updatedWatchlist);
      toast.success("Removed from watchlist");
      onWatchlistUpdate?.();
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      toast.error("Failed to remove from watchlist");
    }
  };

  const openLimitOrder = async (symbol: string, price?: number) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to place limit orders");
      return;
    }
    setLimitOrderSymbol(symbol);
    setLimitOrderPrice(price);
    setLimitOrderOpen(true);
  };

  // Handle buy button click - opens OMS trade dialog
  const handleBuyClick = (symbol: string, securitySubType: string = "PUBLIC", price?: number) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to place orders");
      return;
    }
    setSelectedSymbol(symbol);
    setSelectedSecuritySubType(securitySubType);
    setSelectedPrice(price);
    setTradeType("buy");
    setTradeDialogOpen(true);
  };

  // Handle sell button click - opens OMS trade dialog
  const handleSellClick = (symbol: string, securitySubType: string = "PUBLIC", price?: number) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to place orders");
      return;
    }
    setSelectedSymbol(symbol);
    setSelectedSecuritySubType(securitySubType);
    setSelectedPrice(price);
    setTradeType("sell");
    setTradeDialogOpen(true);
  };

  if (isLoading && watchlistItems.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            My Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (watchlistItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            My Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No stocks in your watchlist yet. Search for stocks and add them to track their prices.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 fill-primary" />
            My Watchlist
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'compact' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSetViewMode('compact')}
              title="Compact view"
            >
              <Layout className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSetViewMode('card')}
              title="Card view"
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'compact' ? (
          <div className="space-y-2">
            {tradeInfoItems.length > 0 ? (
              tradeInfoItems.map((item) => {
                const isPositive = (item.priceChange || 0) >= 0;

                return (
                  <div
                    key={item.securityCode}
                    className="flex items-start justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors gap-3"
                  >
                    <button
                      onClick={() => onStockClick(item.securityCode)}
                      className="flex-1 text-left"
                    >
                      <div className="font-bold text-sm">{item.securityCode}</div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.companyName}</p>
                      <div className="mt-2">
                        <span className="text-lg font-semibold block">
                          ৳ {(item.ltp || 0).toFixed(2)}
                        </span>
                        <div className={`flex items-center gap-2 text-xs font-semibold mt-1 ${
                          isPositive ? 'text-accent' : 'text-destructive'
                        }`}>
                          <span>
                            {isPositive ? '+' : ''}{(item.priceChange || 0).toFixed(2)}
                          </span>
                          <span className="font-medium opacity-80">
                            ({isPositive ? '+' : ''}{(item.priceChangePercent || 0).toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`flex items-center ${
                        isPositive ? 'text-accent' : 'text-destructive'
                      }`}>
                        {isPositive ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-40">
                          <DropdownMenuItem 
                            onClick={() => handleBuyClick(item.securityCode, item.securitySubType, item.ltp)}
                            className="flex justify-center cursor-pointer hover:bg-green-50 dark:hover:bg-green-950"
                          >
                            <span className="text-green-600 font-semibold">Buy</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleSellClick(item.securityCode, item.securitySubType, item.ltp)}
                            className="flex justify-center cursor-pointer hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <span className="text-red-600 font-semibold">Sell</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => removeFromWatchlist(item.securityCode)}
                            className="flex justify-center text-destructive hover:bg-destructive/10 focus:text-destructive cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            <span className="font-semibold">Remove</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })
            ) : (
              // Show watchlist items even if API data not loaded yet
              watchlistItems.map((item) => (
                <div
                  key={item.securityCode}
                  className="flex items-start justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors gap-3"
                >
                  <button
                    onClick={() => onStockClick(item.securityCode)}
                    className="flex-1 text-left"
                  >
                    <div className="font-bold text-sm">{item.securityCode}</div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.securitySubType}</p>
                    <div className="mt-2">
                      <span className="text-sm text-muted-foreground">Loading price...</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center" className="w-40">
                        <DropdownMenuItem
                          onClick={() => removeFromWatchlist(item.securityCode)}
                          className="flex justify-center text-destructive hover:bg-destructive/10 focus:text-destructive cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          <span className="font-semibold">Remove</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tradeInfoItems.map((item) => {
              const isPositive = (item.priceChange || 0) >= 0;

              return (
                <MarketCard
                  key={item.securityCode}
                  symbol={item.securityCode}
                  name={item.companyName}
                  price={`৳${(item.ltp || 0).toFixed(2)}`}
                  change={`${isPositive ? '+' : ''}${(item.priceChange || 0).toFixed(2)}`}
                  changePercent={`${isPositive ? '+' : ''}${(item.priceChangePercent || 0).toFixed(2)}%`}
                  isPositive={isPositive}
                  onClick={() => onStockClick(item.securityCode)}
                  onBuy={() => handleBuyClick(item.securityCode, item.securitySubType, item.ltp)}
                  onSell={() => handleSellClick(item.securityCode, item.securitySubType, item.ltp)}
                  onRemove={() => removeFromWatchlist(item.securityCode)}
                />
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Limit Order Dialog */}
      <LimitOrderDialog
        isOpen={limitOrderOpen}
        onClose={() => setLimitOrderOpen(false)}
        symbol={limitOrderSymbol}
        currentPrice={limitOrderPrice}
      />

      {/* OMS Trade Dialog */}
      <OmsTradeDialog
        open={tradeDialogOpen}
        onOpenChange={setTradeDialogOpen}
        tradeType={tradeType}
        symbol={selectedSymbol}
        securitySubType={selectedSecuritySubType}
        currentPrice={selectedPrice}
      />
    </Card>
  );
};

export default Watchlist;
