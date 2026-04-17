/**
 * BtcInvestment Component
 * Allows users to invest in Bitcoin using USDC or USDT balance
 */

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Bitcoin,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";
import { useToast } from "@/hooks/use-toast";

interface BtcInvestmentProps {
  availableUsdc: number;
  publicKey: string | null;
  onBalanceUpdate?: () => void;
}

type SourceCurrency = "USDC" | "USDT";

const FALLBACK_BTC_PRICE = 87_250.00;

const fetchBtcPrice = async (): Promise<{ price: number; change24h: number }> => {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true"
    );
    if (!res.ok) throw new Error("CoinGecko fetch failed");
    const data = await res.json();
    return {
      price: data.bitcoin?.usd ?? FALLBACK_BTC_PRICE,
      change24h: data.bitcoin?.usd_24h_change ?? 0,
    };
  } catch {
    return { price: FALLBACK_BTC_PRICE, change24h: 0 };
  }
};

export const BtcInvestment = ({ availableUsdc, publicKey, onBalanceUpdate }: BtcInvestmentProps) => {
  const { token, user } = useOmsAuth();
  const { toast } = useToast();

  const [source, setSource] = useState<SourceCurrency>("USDC");
  const [amount, setAmount] = useState("");
  const [btcPrice, setBtcPrice] = useState(FALLBACK_BTC_PRICE);
  const [priceChange24h, setPriceChange24h] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [priceLoading, setPriceLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [btcReceived, setBtcReceived] = useState("");

  const parsedAmount = parseFloat(amount) || 0;
  const fee = parsedAmount * 0.005; // 0.5% fee
  const netAmount = parsedAmount - fee;
  const btcOut = netAmount > 0 ? (netAmount / btcPrice) : 0;

  const loadPrice = async () => {
    const { price, change24h } = await fetchBtcPrice();
    setBtcPrice(price);
    setPriceChange24h(change24h);
  };

  useEffect(() => {
    loadPrice().finally(() => setPriceLoading(false));
    // Auto-refresh every 30s
    const interval = setInterval(loadPrice, 30_000);
    return () => clearInterval(interval);
  }, []);

  const refreshPrice = async () => {
    setRefreshing(true);
    await loadPrice();
    setRefreshing(false);
  };

  const handleInvest = async () => {
    if (parsedAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Enter a valid amount to invest.", variant: "destructive" });
      return;
    }
    if (source === "USDC" && parsedAmount > availableUsdc) {
      toast({ title: "Insufficient USDC", description: "You don't have enough USDC balance.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Record the BTC investment transaction
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (userId) {
        await supabase.from("transactions").insert({
          user_id: userId,
          amount: parsedAmount,
          currency: source,
          type: "deposit",
          status: "completed",
          payment_method: "crypto",
          notes: `BTC Investment: ${btcOut.toFixed(8)} BTC @ $${btcPrice.toLocaleString()} from ${source}`,
        });

        // Also record in portfolio_transactions
        await supabase.from("portfolio_transactions").insert({
          user_id: userId,
          symbol: "BTC",
          name: "Bitcoin",
          shares: btcOut,
          price: btcPrice,
          total: netAmount,
          transaction_type: "buy",
        });

        // Upsert portfolio holding
        const { data: existingHolding } = await supabase
          .from("portfolio_holdings")
          .select("*")
          .eq("user_id", userId)
          .eq("symbol", "BTC")
          .maybeSingle();

        if (existingHolding) {
          const newShares = existingHolding.shares + btcOut;
          const newAvgCost = ((existingHolding.avg_cost * existingHolding.shares) + netAmount) / newShares;
          await supabase
            .from("portfolio_holdings")
            .update({ shares: newShares, avg_cost: newAvgCost })
            .eq("id", existingHolding.id);
        } else {
          await supabase.from("portfolio_holdings").insert({
            user_id: userId,
            symbol: "BTC",
            name: "Bitcoin",
            shares: btcOut,
            avg_cost: btcPrice,
          });
        }

        // Deduct from wallet if USDC
        if (source === "USDC") {
          await supabase
            .from("wallet_balances")
            .update({ balance_usdc: availableUsdc - parsedAmount })
            .eq("user_id", userId);
        }
      }

      setBtcReceived(btcOut.toFixed(8));
      setSuccess(true);
      toast({
        title: "Bitcoin Investment Successful! ₿",
        description: `Invested $${parsedAmount.toFixed(2)} ${source} → ${btcOut.toFixed(8)} BTC`,
      });
      onBalanceUpdate?.();
    } catch (e) {
      console.error("BTC investment error:", e);
      toast({ title: "Investment Failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-5 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-green-500" />
          </div>
          <h3 className="text-lg font-bold">Investment Complete!</h3>
          <p className="text-sm text-muted-foreground">
            You now hold <span className="font-mono font-bold text-foreground">{btcReceived} BTC</span>
          </p>
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Amount Invested</span>
              <span className="font-medium text-foreground">${parsedAmount.toFixed(2)} {source}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>BTC Price</span>
              <span className="font-medium text-foreground">${btcPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Fee (0.5%)</span>
              <span className="font-medium text-foreground">${fee.toFixed(2)}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setSuccess(false); setAmount(""); setBtcReceived(""); }}>
            Invest More
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-yellow-500/5">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Bitcoin className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Invest in Bitcoin</h3>
              <p className="text-[10px] text-muted-foreground">Convert USDC or USDT to BTC</p>
            </div>
          </div>
          <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 text-[9px]">₿ BTC</Badge>
        </div>

        {/* BTC Price */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] text-muted-foreground">Current BTC Price</p>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[8px] text-muted-foreground">LIVE</span>
            </div>
            {priceLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mt-1" />
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold font-mono">${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <Badge variant={priceChange24h >= 0 ? "default" : "destructive"} className="text-[9px] h-4">
                  {priceChange24h >= 0 ? "+" : ""}{priceChange24h.toFixed(2)}%
                </Badge>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refreshPrice} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Source selector */}
        <div>
          <Label className="text-xs">Pay with</Label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            {(["USDC", "USDT"] as SourceCurrency[]).map((cur) => (
              <button
                key={cur}
                onClick={() => setSource(cur)}
                className={`p-2.5 rounded-lg border-2 text-center transition-all ${
                  source === cur
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-border bg-accent/10 hover:border-orange-500/40"
                }`}
              >
                <p className="text-xs font-semibold">{cur}</p>
                <p className="text-[10px] text-muted-foreground">
                  {cur === "USDC" ? `$${availableUsdc.toFixed(2)} avail` : "Multi-chain"}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <Label className="text-xs">Amount ({source})</Label>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-lg h-11 font-semibold"
          />
          {/* Quick amounts */}
          <div className="flex gap-1.5">
            {[25, 50, 100, 250, 500].map((val) => (
              <Button
                key={val}
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-[10px] px-0"
                onClick={() => setAmount(val.toString())}
              >
                ${val}
              </Button>
            ))}
          </div>
        </div>

        {/* Conversion summary */}
        {parsedAmount > 0 && (
          <div className="p-3 rounded-lg bg-muted/50 border space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">You pay</span>
              <span className="font-medium">${parsedAmount.toFixed(2)} {source}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Fee (0.5%)</span>
              <span className="font-medium text-orange-500">-${fee.toFixed(2)}</span>
            </div>
            <div className="border-t pt-1.5 flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">You receive</span>
              <span className="font-bold font-mono text-orange-500">₿ {btcOut.toFixed(8)}</span>
            </div>
          </div>
        )}

        {/* Warning for large amounts */}
        {parsedAmount > 1000 && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-600">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>Large investment. Bitcoin is volatile — only invest what you can afford to lose.</span>
          </div>
        )}

        <Button
          className="w-full h-11 gap-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
          onClick={handleInvest}
          disabled={loading || parsedAmount <= 0}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              Invest ${parsedAmount.toFixed(2)} in Bitcoin
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>

        <p className="text-[9px] text-center text-muted-foreground">
          BTC held in your InveStar portfolio • Prices update in real-time
        </p>
      </CardContent>
    </Card>
  );
};

export default BtcInvestment;
