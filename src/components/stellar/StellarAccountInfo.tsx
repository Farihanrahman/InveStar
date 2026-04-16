import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Check, Wallet, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { StellarNetwork } from "./NetworkSwitcher";

interface StellarBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
}

interface StellarAccountInfoProps {
  publicKey: string | null;
  network: StellarNetwork;
  onAccountNotFound?: () => void;
}

const HORIZON_URLS = {
  testnet: "https://horizon-testnet.stellar.org",
  mainnet: "https://horizon.stellar.org",
};

const EXPLORER_URLS = {
  testnet: "https://stellar.expert/explorer/testnet",
  mainnet: "https://stellar.expert/explorer/public",
};

export const StellarAccountInfo = ({ publicKey, network, onAccountNotFound }: StellarAccountInfoProps) => {
  const [balances, setBalances] = useState<StellarBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sequence, setSequence] = useState<string | null>(null);
  const [subentryCount, setSubentryCount] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchAccount = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setAccountNotFound(false);
    try {
      const response = await fetch(`${HORIZON_URLS[network]}/accounts/${publicKey}`);
      if (response.status === 404) {
        setAccountNotFound(true);
        setBalances([]);
        onAccountNotFound?.();
        return;
      }
      if (!response.ok) throw new Error(`Horizon ${response.status}`);
      const data = await response.json();
      setBalances(data.balances || []);
      setSequence(data.sequence);
      setSubentryCount(data.subentry_count);
    } catch (err) {
      console.error("Error fetching account:", err);
      setAccountNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [publicKey, network, onAccountNotFound]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  const copyToClipboard = async () => {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Address copied to clipboard." });
  };

  if (!publicKey) return null;

  const xlmBalance = balances.find((b) => b.asset_type === "native");
  const otherBalances = balances.filter((b) => b.asset_type !== "native");

  // Calculate min balance: 0.5 base + 0.5 per subentry
  const minBalance = subentryCount !== null ? (2 + subentryCount * 0.5) : 1;
  const availableXlm = xlmBalance ? Math.max(0, parseFloat(xlmBalance.balance) - minBalance) : 0;

  return (
    <Card className="mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="w-5 h-5 text-primary" />
            Stellar Wallet
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
              {network === "mainnet" ? "🌐 Mainnet" : "🧪 Testnet"}
            </Badge>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchAccount} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Wallet Address</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs break-all font-mono">{publicKey}</code>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copyToClipboard}>
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {accountNotFound ? (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-destructive text-sm">Account Not Found on {network}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This account doesn't exist on the Stellar {network} yet.
                  {network === "testnet" && " Fund it via Friendbot or regenerate your wallet."}
                </p>
              </div>
            </div>
          </div>
        ) : loading && balances.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* XLM Balance */}
            {xlmBalance && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">XLM Balance</p>
                  <p className="text-xs text-muted-foreground">
                    Available: {availableXlm.toFixed(4)} XLM
                  </p>
                </div>
                <p className="text-2xl font-bold">{parseFloat(xlmBalance.balance).toFixed(4)} XLM</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Min reserve: {minBalance.toFixed(1)} XLM ({subentryCount} subentries)
                </p>
              </div>
            )}

            {/* Other Assets */}
            {otherBalances.length > 0 && (
              <div className="space-y-2">
                {otherBalances.map((bal, i) => (
                  <div key={i} className="p-3 bg-muted rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{bal.asset_code || "Unknown"}</p>
                      <p className="text-lg font-bold">
                        {parseFloat(bal.balance).toFixed(bal.asset_code === "USDC" ? 2 : 4)}
                        <span className="text-sm font-normal text-muted-foreground ml-1">{bal.asset_code}</span>
                      </p>
                    </div>
                    {bal.asset_code === "USDC" && (
                      <Badge variant="outline" className="text-xs">≈ ${parseFloat(bal.balance).toFixed(2)}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Account Details */}
            {sequence && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                <span>Sequence: {sequence}</span>
                <span>Subentries: {subentryCount}</span>
              </div>
            )}
          </>
        )}

        {/* Explorer link */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => window.open(`${EXPLORER_URLS[network]}/account/${publicKey}`, "_blank")}
        >
          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
          View on Stellar Expert
        </Button>
      </CardContent>
    </Card>
  );
};
