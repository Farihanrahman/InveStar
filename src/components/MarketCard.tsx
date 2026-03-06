import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Info, Trash2 } from "lucide-react";

interface MarketCardProps {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
  rawPrice?: number;
  onClick?: () => void;
  onBuy?: (symbol: string) => void;
  onSell?: (symbol: string) => void;
  onRemove?: (symbol: string) => void;
  onLimitOrder?: (symbol: string, price: number) => void;
}

const MarketCard = ({ symbol, name, price, change, changePercent, isPositive, rawPrice, onClick, onBuy, onSell, onRemove, onLimitOrder }: MarketCardProps) => {
  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBuy?.(symbol);
  };

  const handleSell = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSell?.(symbol);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(symbol);
  };
  
  const handleLimitOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLimitOrder?.(symbol, rawPrice || 0);
  };

  // Mock metrics for tooltip
  const metrics = {
    marketCap: symbol.startsWith("DS") ? "৳125.4B" : "$2.87T",
    peRatio: (15 + Math.random() * 30).toFixed(1),
    volume: symbol.startsWith("DS") ? `${(Math.random() * 5 + 1).toFixed(1)}M` : `${(Math.random() * 80 + 20).toFixed(1)}M`,
    avgVolume: symbol.startsWith("DS") ? `${(Math.random() * 5 + 2).toFixed(1)}M` : `${(Math.random() * 80 + 30).toFixed(1)}M`,
  };

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{symbol}</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="w-48 p-3" side="top">
                    <div className="space-y-2 text-xs">
                      <p className="font-semibold text-sm">{name}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-muted-foreground">Market Cap</p>
                          <p className="font-medium">{metrics.marketCap}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">P/E Ratio</p>
                          <p className="font-medium">{metrics.peRatio}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Volume</p>
                          <p className="font-medium">{metrics.volume}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg Vol</p>
                          <p className="font-medium">{metrics.avgVolume}</p>
                        </div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">{name}</p>
          </div>
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-accent" />
            ) : (
              <TrendingDown className="w-5 h-5 text-destructive" />
            )}
            {onRemove && (
              <button
                onClick={handleRemove}
                className="text-destructive hover:text-destructive transition-colors"
                title="Remove from watchlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="space-y-1 mb-4">
          <p className="text-2xl font-bold">{price}</p>
          <div className={`flex items-center gap-2 text-sm font-medium ${isPositive ? 'text-accent' : 'text-destructive'}`}>
            <span>{change}</span>
            <span>({changePercent})</span>
          </div>
        </div>
        {(onBuy || onSell || onLimitOrder) && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {onBuy && (
                <Button 
                  size="sm" 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleBuy}
                >
                  Buy
                </Button>
              )}
              {onSell && (
                <Button 
                  size="sm" 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleSell}
                >
                  Sell
                </Button>
              )}
            </div>
            {onLimitOrder && (
              <Button 
                size="sm" 
                variant="outline"
                className="w-full border-primary/50 hover:bg-primary/10"
                onClick={handleLimitOrder}
              >
                Limit Order
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketCard;
