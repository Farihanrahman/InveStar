import { Input } from "@/components/ui/input";
import { Search, Star, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";
import { toast } from "sonner";
import { useTradeInformationsLight } from "@/hooks/api/useDashboardApi";

interface StockSearchBarProps {
  onSelectStock: (symbol: string) => void;
  onWatchlistUpdate?: () => void;
}

interface WatchlistSecurityItem {
  securityCode: string;
  securitySubType: string;
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

const StockSearchBar = ({ onSelectStock, onWatchlistUpdate }: StockSearchBarProps) => {
  const { isAuthenticated, user: omsUser } = useOmsAuth();
  const userId = omsUser?.id?.toString() || null;
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistSecurityItem[]>([]);
  const onWatchlistUpdateRef = useRef(onWatchlistUpdate);

  // Fetch trade informations from API with search filter (only when 3+ characters)
  const { data: tradeInfoData, isLoading } = useTradeInformationsLight({
    search: searchQuery.length >= 3 ? searchQuery : undefined,
  });

  // Update ref when callback changes
  useEffect(() => {
    onWatchlistUpdateRef.current = onWatchlistUpdate;
  }, [onWatchlistUpdate]);

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchWatchlistItems();
    }
  }, [isAuthenticated, userId]);

  const fetchWatchlistItems = () => {
    if (!userId) return;
    const items = getStoredWatchlist(userId);
    setWatchlistItems(items);
  };

  // Filter stocks based on securityCode from API response
  // The API returns { data: [...] } and the hook extracts res.data, so tradeInfoData is the full response object
  const apiData = (tradeInfoData as { data?: Array<{ securityCode: string; companyName: string; section: string; category: string; securitySubType: string }> })?.data;
  
  // Only filter when we have at least 3 characters
  const filteredStocks = searchQuery.length >= 3 && apiData
    ? apiData.filter(
        (stock) =>
          stock.securityCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelect = (symbol: string) => {
    onSelectStock(symbol);
    setSearchQuery("");
    setShowResults(false);
  };

  const isInWatchlist = (securityCode: string) => 
    watchlistItems.some(item => item.securityCode === securityCode);

  const addToWatchlist = (securityCode: string, securitySubType: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated || !userId) {
      toast.error("Please login to add to watchlist");
      return;
    }

    if (isInWatchlist(securityCode)) {
      toast.info(`${securityCode} is already in your watchlist`);
      return;
    }

    try {
      const newItem: WatchlistSecurityItem = { securityCode, securitySubType };
      const updatedItems = [...watchlistItems, newItem];
      setStoredWatchlist(userId, updatedItems);
      setWatchlistItems(updatedItems);
      toast.success(`${securityCode} added to watchlist`);
      onWatchlistUpdateRef.current?.();
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      toast.error("Failed to add to watchlist");
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search instruments by security code..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
            // Refetch watchlist items when user searches to ensure fresh data
            if (e.target.value.length > 0) {
              fetchWatchlistItems();
            }
          }}
          onFocus={() => {
            fetchWatchlistItems();
            setShowResults(true);
          }}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          className="pl-10"
        />
        {isLoading && searchQuery && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {showResults && searchQuery && (
        <Card className="absolute z-50 w-full mt-2 max-h-80 overflow-y-auto">
          <CardContent className="p-2">
            {searchQuery.length < 3 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Type at least 3 characters to search
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
              </div>
            ) : filteredStocks.length > 0 ? (
              filteredStocks.map((stock: { 
                securityCode: string; 
                companyName: string; 
                section: string; 
                category: string;
                securitySubType: string;
              }) => (
                <div
                  key={stock.securityCode}
                  onClick={(e) => {
                    e.preventDefault();
                    if (isInWatchlist(stock.securityCode)) {
                      handleSelect(stock.securityCode);
                    } else {
                      addToWatchlist(stock.securityCode, stock.securitySubType, e as React.MouseEvent);
                    }
                  }}
                  className="flex flex-col gap-2 px-3 py-3 rounded-md hover:bg-muted transition-colors cursor-pointer border-b border-border last:border-b-0"
                >
                  {/* Top row: Security code and watchlist status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{stock.securityCode}</span>
                      {isInWatchlist(stock.securityCode) && (
                        <Star className="w-4 h-4 fill-primary text-primary" />
                      )}
                    </div>
                    <div className="text-xs font-medium px-2 py-0.5 bg-primary/10 text-primary rounded">
                      {stock.category}
                    </div>
                  </div>
                  
                  {/* Company name */}
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {stock.companyName}
                  </div>
                  
                  {/* Bottom row: Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                      {stock.securitySubType}
                    </span>
                    <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                      {stock.section}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No instruments found for "{searchQuery}"
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StockSearchBar;
