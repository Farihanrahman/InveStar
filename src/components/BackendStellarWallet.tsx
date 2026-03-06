import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Check, Wallet, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BackendStellarWalletProps {
  publicKey: string | null;
  onWalletRegenerated?: (newPublicKey: string) => void;
}

export const BackendStellarWallet = ({ publicKey, onWalletRegenerated }: BackendStellarWalletProps) => {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [accountNotFound, setAccountNotFound] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (publicKey) fetchBalance();
  }, [publicKey]);

  const fetchBalance = async () => {
    if (!publicKey) return;
    setLoading(true);
    setAccountNotFound(false);
    try {
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
      if (response.status === 404) { setAccountNotFound(true); setBalance(null); return; }
      const data = await response.json();
      const xlmBalance = data.balances.find((b: any) => b.asset_type === 'native');
      if (xlmBalance) setBalance(parseFloat(xlmBalance.balance).toFixed(2));
    } catch (error) {
      console.error('Error fetching balance:', error);
      setAccountNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const regenerateWallet = async () => {
    setRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stellar-wallet', {
        body: { action: 'regenerate' }
      });
      if (error) throw error;
      if (data?.publicKey) {
        toast({ title: "Wallet Regenerated", description: data.testnetFunded ? "New wallet created and funded!" : "New wallet created." });
        if (onWalletRegenerated) onWalletRegenerated(data.publicKey);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error regenerating wallet:', error);
      toast({ title: "Error", description: "Failed to regenerate wallet.", variant: "destructive" });
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied!", description: "Address copied to clipboard." });
    }
  };

  if (!publicKey) return null;

  return (
    <Card className="mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="w-5 h-5 text-primary" />
            Your Wallet
          </CardTitle>
          <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
            TestNet
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Your Wallet Address</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs break-all font-mono">{publicKey}</code>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copyToClipboard}>
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {/* Balance or Error */}
        {accountNotFound ? (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-destructive text-sm">Account Not Found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This wallet doesn't exist on the testnet yet.
                </p>
                <Button variant="destructive" size="sm" className="mt-2" onClick={regenerateWallet} disabled={regenerating}>
                  {regenerating ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Regenerating...</> : <><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Regenerate Wallet</>}
                </Button>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : balance && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">XLM Balance</p>
            <p className="text-2xl font-bold">{balance} XLM</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchBalance} className="flex-1" disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Refresh"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(`https://stellar.expert/explorer/testnet/account/${publicKey}`, '_blank')}>
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            Explorer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
