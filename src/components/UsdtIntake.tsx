import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowDownUp, CheckCircle2, Info, Copy, AlertTriangle } from "lucide-react";
import { UsdtDepositMonitor } from "@/components/UsdtDepositMonitor";
import { supabase } from "@/integrations/supabase/client";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";
import { useToast } from "@/hooks/use-toast";

interface ChainInfo {
  id: string;
  name: string;
  network: string;
  estimatedTime: string;
  fee: number;
  minDeposit: number;
  maxDeposit: number;
  depositAddress: string;
}

interface UsdtIntakeProps {
  publicKey: string | null;
  onBalanceUpdate?: () => void;
}

export const UsdtIntake = ({ publicKey, onBalanceUpdate }: UsdtIntakeProps) => {
  const { token, user } = useOmsAuth();
  const { toast } = useToast();
  const [chains, setChains] = useState<ChainInfo[]>([]);
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingChains, setLoadingChains] = useState(true);
  const [conversionRate, setConversionRate] = useState(0.9995);
  const [pendingTx, setPendingTx] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (publicKey) fetchChains();
  }, [publicKey]);

  const fetchChains = async () => {
    setLoadingChains(true);
    try {
      const { data, error } = await supabase.functions.invoke("usdt-intake", {
        body: { action: "get_chains" },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (error) throw error;
      setChains(data.chains || []);
      setConversionRate(data.conversionRate || 0.9995);
      if (data.chains?.length > 0) setSelectedChain(data.chains[0].id);
    } catch (e) {
      console.error("Error fetching USDT chains:", e);
    } finally {
      setLoadingChains(false);
    }
  };

  const selectedChainData = chains.find((c) => c.id === selectedChain);
  const parsedAmount = parseFloat(amount) || 0;
  const fee = selectedChainData ? (parsedAmount * selectedChainData.fee) / 100 : 0;
  const netUsdt = parsedAmount - fee;
  const usdcOut = parseFloat((netUsdt * conversionRate).toFixed(4));

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const initiateDeposit = async () => {
    if (!selectedChain || !amount || parsedAmount <= 0) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("usdt-intake", {
        body: {
          action: "initiate_deposit",
          chain: selectedChain,
          amount: parsedAmount,
          omsUserId: user?.id ? String(user.id) : undefined,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (error) throw error;
      if (data.success) {
        setPendingTx({ id: data.transactionId, ...data.details });
        toast({ title: "Deposit Initiated", description: data.message });
      } else {
        throw new Error(data.error || "Failed to initiate deposit");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to initiate USDT deposit", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const completeDeposit = async () => {
    if (!pendingTx?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("usdt-intake", {
        body: {
          action: "complete_deposit",
          transactionId: pendingTx.id,
          omsUserId: user?.id ? String(user.id) : undefined,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (error) throw error;
      if (data.success) {
        toast({ title: "USDT → USDC Complete! ✅", description: data.message });
        setPendingTx(null);
        setAmount("");
        onBalanceUpdate?.();
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) return null;

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowDownUp className="w-4 h-4" />
              Fund with USDT
            </CardTitle>
            <CardDescription className="text-xs">
              Deposit USDT from any chain → auto-convert to USDC on Stellar
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 text-[10px]">
            Multi-Chain
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Send USDT from Tron (TRC-20), Solana, or Ethereum. InveStar converts it to USDC on Stellar
            at near 1:1 rate via OTC/exchange partners (Arcanum).
          </p>
        </div>

        {loadingChains ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : pendingTx ? (
          /* Live Deposit Monitor */
          <UsdtDepositMonitor
            transactionId={pendingTx.id}
            chain={selectedChain}
            network={pendingTx.network || pendingTx.chain}
            usdtAmount={pendingTx.usdtAmount}
            usdcAmount={pendingTx.usdcAmount}
            depositAddress={pendingTx.depositAddress}
            estimatedTime={pendingTx.estimatedTime}
            onComplete={() => {
              setPendingTx(null);
              setAmount("");
              onBalanceUpdate?.();
            }}
            onCancel={() => setPendingTx(null)}
          />
        ) : (
          /* Normal deposit form */
          <>
            {/* Chain Selection */}
            <div className="space-y-2">
              <Label className="text-xs">Select USDT Chain</Label>
              <div className="grid grid-cols-3 gap-2">
                {chains.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => setSelectedChain(chain.id)}
                    className={`p-2.5 rounded-lg border-2 text-center transition-all ${
                      selectedChain === chain.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <p className="text-[10px] font-semibold">{chain.network}</p>
                    <p className="text-[9px] text-muted-foreground">{chain.fee}% fee</p>
                    <p className="text-[9px] text-muted-foreground">{chain.estimatedTime}</p>
                  </button>
                ))}
              </div>
              {selectedChainData && (
                <p className="text-[10px] text-muted-foreground">
                  Min: {selectedChainData.minDeposit} USDT • Max: {selectedChainData.maxDeposit} USDT
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-xs">USDT Amount</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg h-11"
                min={selectedChainData?.minDeposit || 0}
                max={selectedChainData?.maxDeposit || 50000}
              />
            </div>

            {/* Conversion breakdown */}
            {parsedAmount > 0 && selectedChainData && (
              <div className="p-3 bg-muted rounded-lg space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">You Send:</span>
                  <span>{parsedAmount.toFixed(2)} USDT ({selectedChainData.network})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conversion Fee ({selectedChainData.fee}%):</span>
                  <span className="text-destructive">-{fee.toFixed(2)} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate:</span>
                  <span>1 USDT = {conversionRate} USDC</span>
                </div>
                <div className="border-t pt-1.5 flex justify-between font-medium">
                  <span>You Receive:</span>
                  <span className="text-green-500">{usdcOut > 0 ? usdcOut.toFixed(2) : "0.00"} USDC</span>
                </div>
              </div>
            )}

            <Button
              onClick={initiateDeposit}
              disabled={loading || !selectedChain || parsedAmount <= 0}
              className="w-full"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><ArrowDownUp className="w-4 h-4 mr-2" /> Fund with USDT</>
              )}
            </Button>
          </>
        )}

        {/* Flow info */}
        <div className="text-[10px] text-muted-foreground space-y-0.5 pt-3 border-t">
          <p>• USDT is received on the selected chain, then converted to USDC on Stellar</p>
          <p>• Conversion via Arcanum / OTC partners at near 1:1 rate</p>
          <p>• Your InveStar wallet is credited in USDC for remittance or investment</p>
          <p>• Supports US → Bangladesh and GCC → Bangladesh corridors</p>
        </div>
      </CardContent>
    </Card>
  );
};
