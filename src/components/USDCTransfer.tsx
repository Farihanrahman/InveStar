import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Plus, CheckCircle2, ExternalLink, AlertCircle, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";
import { useToast } from "@/hooks/use-toast";
import { useConfetti } from "@/hooks/useConfetti";
import { isValidStellarAddress } from "@/lib/validation";
import type { StellarNetwork } from "@/components/stellar/NetworkSwitcher";

interface USDCTransferProps {
  publicKey: string | null;
  network?: StellarNetwork;
}

export const USDCTransfer = ({ publicKey, network = "testnet" }: USDCTransferProps) => {
  const { token, user } = useOmsAuth();
  const [hasTrustline, setHasTrustline] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [checkingTrustline, setCheckingTrustline] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const { toast } = useToast();
  const { triggerConfetti } = useConfetti();

  useEffect(() => {
    if (publicKey) checkTrustline();
  }, [publicKey, network]);

  const handleAddressChange = (value: string) => {
    setRecipientAddress(value);
    setAddressError(null);
    if (value && value.length > 0) {
      if (!value.startsWith('G')) setAddressError('Must start with G');
      else if (value.length !== 56 && value.length > 10) setAddressError('Must be exactly 56 characters');
      else if (value.length === 56 && !isValidStellarAddress(value)) setAddressError('Invalid address');
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setAmountError(null);
    const numValue = parseFloat(value);
    if (value && !isNaN(numValue)) {
      if (numValue <= 0) setAmountError('Must be greater than 0');
      else if (numValue > parseFloat(usdcBalance)) setAmountError('Insufficient balance');
    }
  };

  const checkTrustline = async () => {
    if (!publicKey) return;
    setCheckingTrustline(true);
    try {
      const { data, error } = await supabase.functions.invoke('stellar-usdc-transfer', {
        body: { action: 'check_trustline', network, omsUserId: user?.id ? String(user.id) : undefined },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (error) throw error;
      setHasTrustline(data.hasTrustline);
      setUsdcBalance(data.usdcBalance || "0");
    } catch (error) {
      console.error('Error checking trustline:', error);
    } finally {
      setCheckingTrustline(false);
    }
  };

  const createTrustline = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stellar-usdc-transfer', {
        body: { action: 'create_trustline', network, omsUserId: user?.id ? String(user.id) : undefined },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (error) throw error;
      if (data.success) {
        toast({ title: "USDC Enabled!", description: "You can now send and receive USDC." });
        triggerConfetti('buy');
        setHasTrustline(true);
        setLastTxHash(data.transactionHash);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to enable USDC", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const sendUSDC = async () => {
    if (!recipientAddress || !amount) {
      toast({ title: "Missing Info", description: "Enter recipient and amount", variant: "destructive" });
      return;
    }
    if (!isValidStellarAddress(recipientAddress)) {
      setAddressError('Invalid address');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) { setAmountError('Invalid amount'); return; }
    if (numAmount > parseFloat(usdcBalance)) { setAmountError('Insufficient balance'); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stellar-usdc-transfer', {
        body: { action: 'send_usdc', recipientAddress: recipientAddress.trim(), amount: numAmount, network, omsUserId: user?.id ? String(user.id) : undefined },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (error) throw error;
      if (data.success) {
        toast({ title: "Sent!", description: `${amount} USDC sent to ${recipientAddress.substring(0, 8)}...` });
        triggerConfetti('sell');
        setLastTxHash(data.transactionHash);
        setRecipientAddress("");
        setAmount("");
        setAddressError(null);
        setAmountError(null);
        await checkTrustline();
      }
    } catch (error: any) {
      toast({ title: "Failed", description: error.message || "Transfer failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) return null;

  const isFormValid = recipientAddress && amount && !addressError && !amountError && isValidStellarAddress(recipientAddress) && parseFloat(amount) > 0;

  return (
    <Card className="mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="w-5 h-5 text-primary" />
            Send USDC
          </CardTitle>
          <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
            Stablecoin
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Loading */}
        {checkingTrustline ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Checking USDC status...</span>
          </div>
        ) : !hasTrustline ? (
          /* Enable USDC */
          <div className="p-6 border border-dashed rounded-lg text-center space-y-3">
            <DollarSign className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Enable USDC to send money across borders instantly.</p>
            <Button onClick={createTrustline} disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enabling...</> : <><Plus className="w-4 h-4 mr-2" />Enable USDC</>}
            </Button>
          </div>
        ) : (
          <>
            {/* Balance */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Available USDC</p>
              <p className="text-2xl font-bold">{parseFloat(usdcBalance).toFixed(2)} <span className="text-base font-normal text-muted-foreground">USDC</span></p>
              <p className="text-xs text-muted-foreground">≈ ${parseFloat(usdcBalance).toFixed(2)} USD</p>
            </div>

            {/* Sender */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">From (Your Wallet)</p>
              <p className="font-mono text-xs break-all">{publicKey}</p>
            </div>

            {/* Recipient */}
            <div className="space-y-1.5">
              <Label htmlFor="recipient" className="text-sm">To (Recipient Address)</Label>
              <Input
                id="recipient"
                placeholder="G..."
                value={recipientAddress}
                onChange={(e) => handleAddressChange(e.target.value)}
                className={`font-mono text-sm ${addressError ? 'border-destructive' : ''}`}
                maxLength={56}
              />
              {addressError ? (
                <p className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="w-3 h-3" />{addressError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Starts with G, exactly 56 characters</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-sm">Amount (USDC)</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  min="0.01"
                  step="0.01"
                  className={amountError ? 'border-destructive' : ''}
                />
                <Button variant="outline" size="sm" onClick={() => handleAmountChange(usdcBalance)} className="whitespace-nowrap px-4">
                  Max
                </Button>
              </div>
              {amountError && (
                <p className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="w-3 h-3" />{amountError}</p>
              )}
            </div>

            {/* Send Button */}
            <Button onClick={sendUSDC} disabled={loading || !isFormValid} className="w-full">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : <><Send className="w-4 h-4 mr-2" />Send USDC</>}
            </Button>
          </>
        )}

        {/* Success */}
        {lastTxHash && (
          <div className="p-3 bg-green-500/10 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm">Transaction confirmed</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => window.open(`https://stellar.expert/explorer/${network === "mainnet" ? "public" : "testnet"}/tx/${lastTxHash}`, '_blank')}>
              <ExternalLink className="w-3.5 h-3.5 mr-1" />View
            </Button>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-0.5 pt-2 border-t">
          <p>• USDC is pegged 1:1 to USD — fast, low-fee transfers</p>
          <p>• Transactions complete in ~3-5 seconds</p>
          <p>• Fees: ~0.00001 XLM per transaction</p>
        </div>
      </CardContent>
    </Card>
  );
};
