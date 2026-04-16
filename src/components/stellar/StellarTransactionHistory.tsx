import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, ArrowUpRight, ArrowDownRight, ArrowDownUp, RefreshCw, Clock, CheckCircle2 } from "lucide-react";
import type { StellarNetwork } from "./NetworkSwitcher";

interface StellarOperation {
  id: string;
  type: string;
  created_at: string;
  transaction_hash: string;
  source_account: string;
  // Payment fields
  from?: string;
  to?: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
  // Path payment fields
  source_amount?: string;
  source_asset_type?: string;
  source_asset_code?: string;
  // Change trust
  trustor?: string;
  trustee?: string;
  // Create account
  funder?: string;
  account?: string;
  starting_balance?: string;
}

interface StellarTransactionHistoryProps {
  publicKey: string | null;
  network: StellarNetwork;
}

const HORIZON_URLS = {
  testnet: "https://horizon-testnet.stellar.org",
  mainnet: "https://horizon.stellar.org",
};

const EXPLORER_URLS = {
  testnet: "https://stellar.expert/explorer/testnet",
  mainnet: "https://stellar.expert/explorer/public",
};

export const StellarTransactionHistory = ({ publicKey, network }: StellarTransactionHistoryProps) => {
  const [operations, setOperations] = useState<StellarOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOperations = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const url = `${HORIZON_URLS[network]}/accounts/${publicKey}/operations?order=desc&limit=20`;
      const response = await fetch(url);
      if (response.status === 404) {
        setOperations([]);
        return;
      }
      if (!response.ok) throw new Error(`Horizon returned ${response.status}`);
      const data = await response.json();
      setOperations(data._embedded?.records || []);
    } catch (err: any) {
      console.error("Error fetching Stellar operations:", err);
      setError(err.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  }, [publicKey, network]);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-6)}`;

  const getOperationDisplay = (op: StellarOperation) => {
    const isIncoming = op.to === publicKey;
    const isOutgoing = op.from === publicKey || op.source_account === publicKey;

    switch (op.type) {
      case "create_account":
        return {
          icon: <ArrowDownRight className="w-4 h-4 text-green-500" />,
          label: op.funder === publicKey ? "Funded Account" : "Account Created",
          detail: op.funder === publicKey
            ? `→ ${truncateAddress(op.account || "")}`
            : `by ${truncateAddress(op.funder || "")}`,
          amount: op.starting_balance ? `${parseFloat(op.starting_balance).toFixed(2)} XLM` : "",
          amountColor: op.funder === publicKey ? "text-red-500" : "text-green-500",
          prefix: op.funder === publicKey ? "-" : "+",
        };

      case "payment":
        return {
          icon: isIncoming
            ? <ArrowDownRight className="w-4 h-4 text-green-500" />
            : <ArrowUpRight className="w-4 h-4 text-red-500" />,
          label: isIncoming ? "Received" : "Sent",
          detail: isIncoming
            ? `from ${truncateAddress(op.from || "")}`
            : `to ${truncateAddress(op.to || "")}`,
          amount: `${parseFloat(op.amount || "0").toFixed(op.asset_code === "USDC" ? 2 : 4)} ${op.asset_code || "XLM"}`,
          amountColor: isIncoming ? "text-green-500" : "text-red-500",
          prefix: isIncoming ? "+" : "-",
        };

      case "path_payment_strict_send":
      case "path_payment_strict_receive":
        return {
          icon: <ArrowDownUp className="w-4 h-4 text-primary" />,
          label: "DEX Swap",
          detail: `${parseFloat(op.source_amount || op.amount || "0").toFixed(4)} ${op.source_asset_code || "XLM"} → ${op.asset_code || "XLM"}`,
          amount: `${parseFloat(op.amount || "0").toFixed(op.asset_code === "USDC" ? 2 : 4)} ${op.asset_code || "XLM"}`,
          amountColor: "text-primary",
          prefix: "",
        };

      case "change_trust":
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-blue-500" />,
          label: "Trustline",
          detail: `${op.asset_code || "Unknown"} trustline ${op.amount === "0" ? "removed" : "added"}`,
          amount: "",
          amountColor: "",
          prefix: "",
        };

      case "manage_sell_offer":
      case "manage_buy_offer":
      case "create_passive_sell_offer":
        return {
          icon: <ArrowDownUp className="w-4 h-4 text-accent-foreground" />,
          label: "DEX Offer",
          detail: `${op.amount || ""} ${op.asset_code || "XLM"}`,
          amount: "",
          amountColor: "",
          prefix: "",
        };

      default:
        return {
          icon: <Clock className="w-4 h-4 text-muted-foreground" />,
          label: op.type.replace(/_/g, " "),
          detail: "",
          amount: "",
          amountColor: "",
          prefix: "",
        };
    }
  };

  if (!publicKey) return null;

  return (
    <Card className="mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-primary" />
            On-Chain Transactions
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {network === "mainnet" ? "🌐 Mainnet" : "🧪 Testnet"}
            </Badge>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchOperations} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && operations.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading on-chain history…</span>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchOperations}>
              Retry
            </Button>
          </div>
        ) : operations.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 text-sm">
            No on-chain transactions yet. Create a wallet and make your first transfer!
          </p>
        ) : (
          <div className="space-y-2">
            {operations.map((op) => {
              const display = getOperationDisplay(op);
              return (
                <div
                  key={op.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-full bg-muted shrink-0">{display.icon}</div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{display.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{display.detail}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(op.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {display.amount && (
                      <p className={`font-semibold text-sm ${display.amountColor}`}>
                        {display.prefix}{display.amount}
                      </p>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => window.open(`${EXPLORER_URLS[network]}/tx/${op.transaction_hash}`, "_blank")}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {operations.length > 0 && (
          <div className="mt-3 text-center">
            <Button
              variant="link"
              size="sm"
              onClick={() => window.open(`${EXPLORER_URLS[network]}/account/${publicKey}`, "_blank")}
            >
              View all on Stellar Expert <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
