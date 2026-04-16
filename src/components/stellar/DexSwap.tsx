import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowDownUp, ExternalLink, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";
import { useToast } from "@/hooks/use-toast";
import { useConfetti } from "@/hooks/useConfetti";
import type { StellarNetwork } from "./NetworkSwitcher";

interface DexSwapProps {
  publicKey: string | null;
  network: StellarNetwork;
}

export const DexSwap = ({ publicKey, network }: DexSwapProps) => {
  const { token, user } = useOmsAuth();
  const { toast } = useToast();
  const { triggerConfetti } = useConfetti();

  const [sourceAsset, setSourceAsset] = useState<"XLM" | "USDC">("XLM");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<{ destAmount: string; hasPath: boolean; message?: string } | null>(null);
  const [xlmBalance, setXlmBalance] = useState("0");
  const [usdcBalance, setUsdcBalance] = useState("0");
  const [hasTrustline, setHasTrustline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const destAsset = sourceAsset === "XLM" ? "USDC" : "XLM";
  const omsUserId = user?.id ? String(user.id) : undefined;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchBalances = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stellar-dex-swap", {
        body: { action: "balances", network, omsUserId },
        headers,
      });
      if (error) throw error;
      setXlmBalance(data.xlm || "0");
      setUsdcBalance(data.usdc || "0");
      setHasTrustline(data.hasTrustline || false);
    } catch (err) {
      console.error("Error fetching balances:", err);
    } finally {
      setLoading(false);
    }
  }, [publicKey, network, token, omsUserId]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Debounced quote
  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setQuote(null);
      return;
    }
    const timer = setTimeout(async () => {
      setQuoting(true);
      try {
        const { data, error } = await supabase.functions.invoke("stellar-dex-swap", {
          body: { action: "quote", network, sourceAsset, destAsset, amount },
          headers,
        });
        if (error) throw error;
        setQuote(data);
      } catch {
        setQuote(null);
      } finally {
        setQuoting(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [amount, sourceAsset, network]);

  const handleFlip = () => {
    setSourceAsset(sourceAsset === "XLM" ? "USDC" : "XLM");
    setAmount("");
    setQuote(null);
  };

  const handleSwap = async () => {
    if (!amount || !quote?.hasPath) return;
    setSwapping(true);
    try {
      const { data, error } = await supabase.functions.invoke("stellar-dex-swap", {
        body: { action: "swap", network, sourceAsset, destAsset, amount, omsUserId, slippage: 1 },
        headers,
      });
      if (error) throw error;
      if (data.success) {
        toast({
          title: "Swap Successful!",
          description: data.message,
        });
        triggerConfetti('buy');
        setLastTxHash(data.transactionHash);
        setAmount("");
        setQuote(null);
        fetchBalances();
      }
    } catch (err: any) {
      toast({
        title: "Swap Failed",
        description: err.message || "Failed to execute swap",
        variant: "destructive",
      });
    } finally {
      setSwapping(false);
    }
  };

  const maxAmount = sourceAsset === "XLM"
    ? Math.max(0, parseFloat(xlmBalance) - 2).toFixed(7)
    : usdcBalance;

  if (!publicKey) return null;

  const explorerBase = network === "mainnet"
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet";

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownUp className="w-5 h-5" />
              DEX Swap
            </CardTitle>
            <CardDescription>
              Swap XLM ↔ USDC via Stellar Decentralized Exchange
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-accent/10 text-accent-foreground">
            {network === "mainnet" ? "🌐 Mainnet" : "🧪 Testnet"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Balances */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">XLM Balance</p>
            <p className="text-lg font-bold">{loading ? "..." : parseFloat(xlmBalance).toFixed(4)}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">USDC Balance</p>
            <p className="text-lg font-bold">{loading ? "..." : parseFloat(usdcBalance).toFixed(2)}</p>
            {!hasTrustline && !loading && (
              <p className="text-xs text-yellow-500 mt-1">No trustline</p>
            )}
          </div>
        </div>

        {/* Swap form */}
        <div className="space-y-3">
          {/* Source */}
          <div className="p-4 border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">You send</Label>
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => setAmount(maxAmount)}
              >
                Max: {parseFloat(maxAmount).toFixed(sourceAsset === "XLM" ? 4 : 2)}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
                className="text-xl font-bold border-0 p-0 h-auto focus-visible:ring-0"
              />
              <Badge variant="outline" className="text-base px-3 py-1.5 font-semibold">
                {sourceAsset}
              </Badge>
            </div>
          </div>

          {/* Flip button */}
          <div className="flex justify-center -my-1">
            <Button variant="outline" size="icon" className="rounded-full h-9 w-9" onClick={handleFlip}>
              <ArrowDownUp className="w-4 h-4" />
            </Button>
          </div>

          {/* Dest */}
          <div className="p-4 border rounded-lg space-y-2 bg-muted/50">
            <Label className="text-sm text-muted-foreground">You receive (estimated)</Label>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-xl font-bold">
                {quoting ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : quote?.hasPath ? (
                  parseFloat(quote.destAmount).toFixed(destAsset === "XLM" ? 4 : 2)
                ) : amount ? (
                  <span className="text-muted-foreground text-sm">No quote</span>
                ) : (
                  "0.00"
                )}
              </div>
              <Badge variant="outline" className="text-base px-3 py-1.5 font-semibold">
                {destAsset}
              </Badge>
            </div>
          </div>
        </div>

        {/* Rate info */}
        {quote?.hasPath && amount && (
          <div className="text-xs text-muted-foreground text-center">
            1 {sourceAsset} ≈ {(parseFloat(quote.destAmount) / parseFloat(amount)).toFixed(6)} {destAsset}
            <span className="ml-2 text-yellow-500">• 1% slippage tolerance</span>
          </div>
        )}

        {!hasTrustline && destAsset === "USDC" && (
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />
            <p className="text-xs text-yellow-600">
              You need a USDC trustline before swapping to USDC. Create one in the USDC Transfer section above.
            </p>
          </div>
        )}

        {/* Swap button */}
        <Button
          onClick={handleSwap}
          disabled={swapping || !amount || !quote?.hasPath || parseFloat(amount) <= 0 || (!hasTrustline && destAsset === "USDC")}
          className="w-full"
          size="lg"
        >
          {swapping ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Swapping...
            </>
          ) : (
            <>
              <ArrowDownUp className="w-4 h-4 mr-2" />
              Swap {sourceAsset} → {destAsset}
            </>
          )}
        </Button>

        {/* Refresh */}
        <Button variant="ghost" size="sm" className="w-full" onClick={fetchBalances} disabled={loading}>
          <RefreshCw className={`w-3 h-3 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh Balances
        </Button>

        {/* Last TX */}
        {lastTxHash && (
          <div className="p-3 bg-green-500/10 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm">Swap confirmed</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`${explorerBase}/tx/${lastTxHash}`, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              View
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Powered by Stellar DEX path payments • Near-zero fees
        </p>
      </CardContent>
    </Card>
  );
};
