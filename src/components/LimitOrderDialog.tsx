import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LimitOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  symbol?: string;
  currentPrice?: number;
  orderType?: "buy" | "sell";
}

const LimitOrderDialog = ({ 
  isOpen, 
  onClose, 
  symbol = "", 
  currentPrice,
  orderType: initialOrderType = "buy"
}: LimitOrderDialogProps) => {
  const [orderSymbol, setOrderSymbol] = useState(symbol);
  const [orderType, setOrderType] = useState<"buy" | "sell">(initialOrderType);
  const [quantity, setQuantity] = useState("");
  const [limitPrice, setLimitPrice] = useState(currentPrice?.toFixed(2) || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!orderSymbol || !quantity || !limitPrice) {
      toast.error("Please fill in all fields");
      return;
    }

    const qty = parseInt(quantity);
    const price = parseFloat(limitPrice);

    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid limit price");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to place limit orders");
        return;
      }

      const { error } = await supabase.from("virtual_orders").insert({
        user_id: session.user.id,
        symbol: orderSymbol.toUpperCase(),
        order_type: orderType,
        quantity: qty,
        limit_price: price,
        status: "pending"
      });

      if (error) throw error;

      toast.success(`Limit ${orderType} order placed for ${qty} ${orderSymbol.toUpperCase()} at $${price.toFixed(2)}`);
      onClose();
      setOrderSymbol("");
      setQuantity("");
      setLimitPrice("");
    } catch (error) {
      console.error("Error placing limit order:", error);
      toast.error("Failed to place limit order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Place Limit Order</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Order Type</Label>
            <RadioGroup
              value={orderType}
              onValueChange={(value) => setOrderType(value as "buy" | "sell")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="buy" id="limit-buy" />
                <Label htmlFor="limit-buy" className="text-green-500 font-medium cursor-pointer">
                  Limit Buy
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sell" id="limit-sell" />
                <Label htmlFor="limit-sell" className="text-red-500 font-medium cursor-pointer">
                  Limit Sell
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit-symbol">Stock Symbol</Label>
            <Input
              id="limit-symbol"
              placeholder="e.g., AAPL"
              value={orderSymbol}
              onChange={(e) => setOrderSymbol(e.target.value.toUpperCase())}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit-quantity">Quantity</Label>
            <Input
              id="limit-quantity"
              type="number"
              placeholder="e.g., 10"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              step="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit-price">Limit Price ($)</Label>
            <Input
              id="limit-price"
              type="number"
              placeholder="e.g., 150.00"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              min="0.01"
              step="0.01"
            />
            {currentPrice && (
              <p className="text-xs text-muted-foreground">
                Current price: ${currentPrice.toFixed(2)}
              </p>
            )}
          </div>

          {quantity && limitPrice && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Order Summary</p>
              <p className="text-sm">
                {orderType === "buy" ? "Buy" : "Sell"} {quantity} shares at ${parseFloat(limitPrice || "0").toFixed(2)}
              </p>
              <p className="text-lg font-bold">
                Total: ${(parseInt(quantity || "0") * parseFloat(limitPrice || "0")).toFixed(2)}
              </p>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full ${orderType === "buy" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
          >
            {isSubmitting ? "Placing Order..." : `Place Limit ${orderType === "buy" ? "Buy" : "Sell"} Order`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LimitOrderDialog;
