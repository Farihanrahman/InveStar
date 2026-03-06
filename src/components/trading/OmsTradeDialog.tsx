/**
 * OMS Trade Dialog Component
 * Trade dialog specifically for OMS order placement with all required fields
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";
import { useCreateAndSubmitOrder } from "@/hooks/api/useOrderApi";
import type { CreateOrderPayload } from "@/services/oms/orderService";
import { Loader2 } from "lucide-react";

export interface OmsTradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tradeType: "buy" | "sell";
  symbol?: string;
  securitySubType?: string;
  currentPrice?: number;
  onSuccess?: () => void;
}

export const OmsTradeDialog = ({
  open,
  onOpenChange,
  tradeType,
  symbol: initialSymbol = "",
  securitySubType = "PUBLIC",
  currentPrice,
  onSuccess,
}: OmsTradeDialogProps) => {
  const { user } = useOmsAuth();
  const createAndSubmitOrder = useCreateAndSubmitOrder();

  const [symbol, setSymbol] = useState(initialSymbol);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState(currentPrice?.toString() || "");
  const [orderType, setOrderType] = useState<"LIMIT" | "MARKET">("LIMIT");
  

  // Reset form when dialog opens with new symbol
  useEffect(() => {
    if (open) {
      setSymbol(initialSymbol);
      setPrice(currentPrice?.toString() || "");
    }
  }, [open, initialSymbol, currentPrice]);

  const handleSubmit = async () => {
    if (!symbol || !quantity || (orderType === "LIMIT" && !price)) {
      return;
    }

    // Get clientCode from user data - adjust based on your user structure
    const clientCode = (user as Record<string, unknown>)?.clientCode as string || 
                       (user as Record<string, unknown>)?.boId as string || 
                       "DUMMY000";

    const payload: CreateOrderPayload = {
      symbol: symbol.toUpperCase(),
      clientCode,
      type: orderType,
      timeInForce: "DAY",
      securitySubType,
      side: tradeType.toUpperCase() as "BUY" | "SELL",
      assetClass: "EQ",
      companyCategory: "A",
      marketStatus: "OPEN",
      quantity: parseInt(quantity, 10),
      ...(orderType === "LIMIT" && { price: parseFloat(price) }),
    };

    try {
      await createAndSubmitOrder.mutateAsync(payload);
      onOpenChange(false);
      onSuccess?.();
      // Reset form
      setQuantity("");
      setPrice("");
    } catch (error) {
      console.error("Order placement failed:", error);
    }
  };

  const estimatedTotal = quantity && price 
    ? (parseInt(quantity, 10) * parseFloat(price)).toFixed(2) 
    : "0.00";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={tradeType === "buy" ? "text-green-500" : "text-red-500"}>
            {tradeType === "buy" ? "Buy Order" : "Sell Order"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="symbol">Symbol</Label>
            <Input
              id="symbol"
              placeholder="Enter stock symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              disabled={!!initialSymbol}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="orderType">Order Type</Label>
            <Select value={orderType} onValueChange={(v) => setOrderType(v as "LIMIT" | "MARKET")}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LIMIT">Limit</SelectItem>
                <SelectItem value="MARKET">Market</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
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

          {orderType === "LIMIT" && (
            <div className="grid gap-2">
              <Label htmlFor="price">
                Price
                {currentPrice && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Current: ৳{currentPrice.toFixed(2)})
                  </span>
                )}
              </Label>
              <Input
                id="price"
                type="number"
                placeholder="Limit price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
                min="0.01"
              />
            </div>
          )}

          {/* Order Summary */}
          <div className="rounded-lg bg-muted p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order Type:</span>
              <span className="font-medium">{orderType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Side:</span>
              <span className={`font-medium ${tradeType === "buy" ? "text-green-500" : "text-red-500"}`}>
                {tradeType.toUpperCase()}
              </span>
            </div>
            {orderType === "LIMIT" && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimated Total:</span>
                <span className="font-medium">৳{estimatedTotal}</span>
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={createAndSubmitOrder.isPending || !symbol || !quantity || (orderType === "LIMIT" && !price)}
          className={`w-full ${
            tradeType === "buy"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {createAndSubmitOrder.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `${tradeType === "buy" ? "Buy" : "Sell"} ${symbol || "Stock"}`
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default OmsTradeDialog;
