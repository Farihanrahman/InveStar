/**
 * TradeDialog Component
 * Reusable trade dialog for buy/sell operations
 */

import { useState } from "react";
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

export interface TradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tradeType: "buy" | "sell";
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  shares: string;
  onSharesChange: (shares: string) => void;
  onSubmit: () => Promise<void> | void;
  isLoading?: boolean;
  availableSymbols?: string[];
  showAdvancedOptions?: boolean;
  // Advanced options
  qtype?: string;
  onQtypeChange?: (qtype: string) => void;
  validity?: string;
  onValidityChange?: (validity: string) => void;
  dispQty?: string;
  onDispQtyChange?: (dispQty: string) => void;
}

export const TradeDialog = ({
  open,
  onOpenChange,
  tradeType,
  symbol,
  onSymbolChange,
  shares,
  onSharesChange,
  onSubmit,
  isLoading = false,
  availableSymbols = [],
  showAdvancedOptions = false,
  qtype = "Market",
  onQtypeChange,
  validity = "Day",
  onValidityChange,
  dispQty = "",
  onDispQtyChange,
}: TradeDialogProps) => {
  const handleSubmit = async () => {
    await onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={tradeType === "buy" ? "text-green-500" : "text-red-500"}>
            {tradeType === "buy" ? "Buy Stock" : "Sell Stock"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="symbol">Symbol</Label>
            {availableSymbols.length > 0 ? (
              <Select value={symbol} onValueChange={onSymbolChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select symbol" />
                </SelectTrigger>
                <SelectContent>
                  {availableSymbols.map((sym) => (
                    <SelectItem key={sym} value={sym}>
                      {sym}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="symbol"
                placeholder="Enter stock symbol"
                value={symbol}
                onChange={(e) => onSymbolChange(e.target.value.toUpperCase())}
              />
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="shares">Shares</Label>
            <Input
              id="shares"
              type="number"
              placeholder="Number of shares"
              value={shares}
              onChange={(e) => onSharesChange(e.target.value)}
              min="1"
            />
          </div>

          {showAdvancedOptions && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="qtype">Order Type</Label>
                <Select value={qtype} onValueChange={onQtypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select order type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Market">Market</SelectItem>
                    <SelectItem value="Limit">Limit</SelectItem>
                    <SelectItem value="SL-M">Stop Loss - Market</SelectItem>
                    <SelectItem value="SL-L">Stop Loss - Limit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="validity">Validity</Label>
                <Select value={validity} onValueChange={onValidityChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select validity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Day">Day</SelectItem>
                    <SelectItem value="FOK">FOK</SelectItem>
                    <SelectItem value="IOC">IOC</SelectItem>
                    <SelectItem value="GTC">GTC</SelectItem>
                    <SelectItem value="Session">Session</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dispQty">Disclosed Quantity (Optional)</Label>
                <Input
                  id="dispQty"
                  type="number"
                  placeholder="Disclosed quantity"
                  value={dispQty}
                  onChange={(e) => onDispQtyChange?.(e.target.value)}
                  min="0"
                />
              </div>
            </>
          )}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className={`w-full ${
            tradeType === "buy"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {isLoading ? "Processing..." : `${tradeType === "buy" ? "Buy" : "Sell"} Shares`}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default TradeDialog;
