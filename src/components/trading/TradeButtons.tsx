/**
 * TradeButtons Component
 * Reusable buy/sell/limit order buttons
 */

import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Clock, RefreshCw } from "lucide-react";

interface TradeButtonsProps {
  onBuy: () => void;
  onSell: () => void;
  onLimitOrder?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  showLimitOrder?: boolean;
  showRefresh?: boolean;
  size?: "default" | "sm" | "lg";
}

export const TradeButtons = ({
  onBuy,
  onSell,
  onLimitOrder,
  onRefresh,
  isRefreshing = false,
  showLimitOrder = false,
  showRefresh = true,
  size = "default",
}: TradeButtonsProps) => {
  return (
    <>
      <Button 
        className="gap-2 bg-green-600 hover:bg-green-700"
        onClick={onBuy}
        size={size}
      >
        <TrendingUp className="w-4 h-4" />
        Buy
      </Button>
      <Button 
        className="gap-2 bg-red-600 hover:bg-red-700"
        onClick={onSell}
        size={size}
      >
        <TrendingDown className="w-4 h-4" />
        Sell
      </Button>
      {showLimitOrder && onLimitOrder && (
        <Button 
          variant="outline"
          className="gap-2 border-primary/50"
          onClick={onLimitOrder}
          size={size}
        >
          <Clock className="w-4 h-4" />
          Limit Order
        </Button>
      )}
      {showRefresh && onRefresh && (
        <Button 
          variant="outline" 
          size={size}
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      )}
    </>
  );
};

export default TradeButtons;
