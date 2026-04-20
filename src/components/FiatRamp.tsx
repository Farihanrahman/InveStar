import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowDownUp, Building2, CheckCircle2, Info, DollarSign, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";
import { useToast } from "@/hooks/use-toast";
import { useConfetti } from "@/hooks/useConfetti";

interface Anchor {
  id: string;
  name: string;
  domain: string;
  fee: number;
  minDeposit: number;
  maxDeposit: number;
}

interface FiatRampProps {
  publicKey: string | null;
  availableUsdc?: number;
  onBalanceUpdate?: () => void;
}

export const FiatRamp = ({ publicKey, availableUsdc = 0, onBalanceUpdate }: FiatRampProps) => {
  const { token, user } = useOmsAuth();
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [selectedAnchor, setSelectedAnchor] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAnchors, setLoadingAnchors] = useState(true);
  const [rampType, setRampType] = useState<"deposit" | "withdraw">("deposit");
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);
  const { toast } = useToast();
  const { triggerConfetti } = useConfetti();

  const fetchAnchors = useCallback(async () => {
    setLoadingAnchors(true);
    try {
      const { data, error } = await supabase.functions.invoke('stellar-anchor-ramp', {
        body: { action: 'get_anchors' },
        headers: token ? {
          Authorization: `Bearer ${token}`,
        } : {},
      });

      if (error) throw error;
      setAnchors(data.anchors || []);
      if (data.anchors?.length > 0) {
        setSelectedAnchor(data.anchors[0].id);
      }
    } catch (error) {
      console.error('Error fetching anchors:', error);
    } finally {
      setLoadingAnchors(false);
    }
  }, [token]);

  useEffect(() => {
    if (publicKey) {
      void fetchAnchors();
    }
  }, [publicKey, fetchAnchors]);

  const initiateRamp = async () => {
    if (!selectedAnchor || !amount) {
      toast({
        title: "Missing Information",
        description: "Please select an anchor and enter an amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const action = rampType === "deposit" ? "initiate_deposit" : "initiate_withdrawal";
      
      const { data, error } = await supabase.functions.invoke('stellar-anchor-ramp', {
        body: { 
          action,
          anchor: selectedAnchor,
          amount: parseFloat(amount),
          rampType,
          omsUserId: user?.id ? String(user.id) : undefined,
        },
        headers: token ? {
          Authorization: `Bearer ${token}`,
        } : {},
      });

      if (error) throw error;

      if (data.success) {
        setPendingTransaction({
          id: data.transactionId,
          ...data.details,
          type: rampType
        });
        
        toast({
          title: rampType === "deposit" ? "Deposit Initiated" : "Withdrawal Initiated",
          description: data.message,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate transaction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const completeTestnetDeposit = async () => {
    if (!pendingTransaction?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stellar-anchor-ramp', {
        body: { 
          action: 'complete_testnet_deposit',
          transactionId: pendingTransaction.id,
          omsUserId: user?.id ? String(user.id) : undefined,
        },
        headers: token ? {
          Authorization: `Bearer ${token}`,
        } : {},
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success!",
          description: data.message,
        });
        triggerConfetti('buy');
        setPendingTransaction(null);
        setAmount("");
        onBalanceUpdate?.();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete transaction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedAnchorData = anchors.find(a => a.id === selectedAnchor);
  const parsedAmount = parseFloat(amount) || 0;
  const fee = selectedAnchorData ? (parsedAmount * selectedAnchorData.fee) / 100 : 0;
  const netAmount = parsedAmount - fee;
  const insufficientUsdc = rampType === "withdraw" && parsedAmount > availableUsdc;

  if (!publicKey) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownUp className="w-5 h-5" />
              USD ↔ USDC On/Off Ramp
            </CardTitle>
            <CardDescription>
              Convert between USD and USDC using Stellar anchors
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-green-500/10 text-green-500">
            Stellar Anchor Protocol
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Banner */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-500">How Stellar Anchors Work</p>
              <p className="text-muted-foreground mt-1">
                Anchors like Circle and MoneyGram act as bridges between traditional banking and the Stellar network. 
                They hold your USD in regulated accounts and issue equivalent USDC tokens on Stellar.
              </p>
            </div>
          </div>
        </div>

        {loadingAnchors ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading anchors...</span>
          </div>
        ) : pendingTransaction ? (
          // Pending Transaction View
          <div className="space-y-4">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="font-medium text-yellow-600 mb-2">Transaction Pending</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{pendingTransaction.type === "deposit" ? "USD → USDC" : "USDC → USD"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Anchor:</span>
                  <span>{pendingTransaction.anchor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span>
                    {pendingTransaction.type === "deposit" 
                      ? `$${pendingTransaction.usdAmount?.toFixed(2)} USD`
                      : `${pendingTransaction.usdcAmount?.toFixed(2)} USDC`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee:</span>
                  <span>${pendingTransaction.fee?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>You Receive:</span>
                  <span className="text-green-500">
                    {pendingTransaction.type === "deposit"
                      ? `${pendingTransaction.usdcAmount?.toFixed(2)} USDC`
                      : `$${pendingTransaction.usdAmount?.toFixed(2)} USD`}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border border-dashed rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-4">
                In production, you would complete payment via the anchor's website.
                <br />For testnet demo, click below to simulate completion.
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setPendingTransaction(null)}>
                  Cancel
                </Button>
                <Button onClick={completeTestnetDeposit} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Complete (Testnet)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Ramp Type Tabs */}
            <Tabs value={rampType} onValueChange={(v) => setRampType(v as "deposit" | "withdraw")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="deposit" className="gap-2">
                  <DollarSign className="w-4 h-4" />
                  Buy USDC (On-Ramp)
                </TabsTrigger>
                <TabsTrigger value="withdraw" className="gap-2">
                  <Coins className="w-4 h-4" />
                  Sell USDC (Off-Ramp)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="deposit" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Convert your USD to USDC on the Stellar network. The USDC will be deposited directly to your wallet.
                </p>
              </TabsContent>

              <TabsContent value="withdraw" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Convert your USDC back to USD and withdraw to your bank account.
                </p>
              </TabsContent>
            </Tabs>

            {/* Anchor Selection */}
            <div className="space-y-2">
              <Label>Select Anchor</Label>
              <Select value={selectedAnchor} onValueChange={setSelectedAnchor}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an anchor" />
                </SelectTrigger>
                <SelectContent>
                  {anchors.map((anchor) => (
                    <SelectItem key={anchor.id} value={anchor.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>{anchor.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {anchor.fee}% fee
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAnchorData && (
                <p className="text-xs text-muted-foreground">
                  Min: ${selectedAnchorData.minDeposit} • Max: ${selectedAnchorData.maxDeposit}
                </p>
              )}
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label>{rampType === "deposit" ? "USD Amount" : "USDC Amount"}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {rampType === "deposit" ? "$" : ""}
                </span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={rampType === "deposit" ? "pl-7" : ""}
                  min={selectedAnchorData?.minDeposit || 0}
                  max={selectedAnchorData?.maxDeposit || 10000}
                />
              </div>
              {rampType === "withdraw" && parsedAmount > 0 && (
                <p className={`text-xs ${insufficientUsdc ? "text-destructive" : "text-muted-foreground"}`}>
                  Available: {availableUsdc.toFixed(2)} USDC
                </p>
              )}
            </div>

            {/* Fee Breakdown */}
            {parsedAmount > 0 && selectedAnchorData && (
              <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {rampType === "deposit" ? "You Pay:" : "You Send:"}
                  </span>
                  <span>
                    {rampType === "deposit" ? `$${parsedAmount.toFixed(2)} USD` : `${parsedAmount.toFixed(2)} USDC`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee ({selectedAnchorData.fee}%):</span>
                  <span className="text-destructive">-${fee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>You Receive:</span>
                  <span className="text-green-500">
                    {rampType === "deposit" 
                      ? `${netAmount.toFixed(2)} USDC`
                      : `$${netAmount.toFixed(2)} USD`}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              onClick={initiateRamp} 
              disabled={loading || !selectedAnchor || !amount || parsedAmount <= 0 || insufficientUsdc}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowDownUp className="w-4 h-4 mr-2" />
                  {rampType === "deposit" ? "Buy USDC" : "Sell USDC"}
                </>
              )}
            </Button>
          </>
        )}

        {/* Info Footer */}
        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
          <p>• Testnet simulation - no real money involved</p>
          <p>• In production, you'd complete KYC with the anchor</p>
          <p>• Settlements typically take 1-3 business days</p>
          <p>• Stellar anchors follow SEP-24 interactive protocol</p>
        </div>
      </CardContent>
    </Card>
  );
};
