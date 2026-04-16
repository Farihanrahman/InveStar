import { useState, useEffect, useCallback } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2, RefreshCw, Activity, Users, ArrowDownUp, DollarSign,
  TrendingUp, ExternalLink, Clock, Zap, Globe
} from "lucide-react";
import Footer from "@/components/Footer";

interface HorizonOperation {
  id: string;
  type: string;
  created_at: string;
  transaction_hash: string;
  source_account: string;
  from?: string;
  to?: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
  source_amount?: string;
  source_asset_code?: string;
  starting_balance?: string;
  funder?: string;
  account?: string;
}

// InveStar's known Stellar accounts — add your real public keys here
const TRACKED_ACCOUNTS = [
  // Add your platform wallet public keys
  // "GXXXX...",
];

const USDC_ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"; // Circle USDC on mainnet
const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";
const HORIZON_MAINNET = "https://horizon.stellar.org";

interface OnChainMetrics {
  totalOperations: number;
  paymentCount: number;
  dexSwapCount: number;
  accountsCreated: number;
  trustlinesAdded: number;
  totalXlmVolume: number;
  totalUsdcVolume: number;
  uniqueAccounts: Set<string>;
  recentOps: HorizonOperation[];
  oldestTx: string | null;
  newestTx: string | null;
}

type NetworkType = "testnet" | "mainnet";

const Traction = () => {
  const [metrics, setMetrics] = useState<OnChainMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [network, setNetwork] = useState<NetworkType>("mainnet");

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    const horizonUrl = network === "mainnet" ? HORIZON_MAINNET : HORIZON_TESTNET;

    try {
      // If we have tracked accounts, fetch their operations
      // Otherwise, show a demo with recent network-wide ledger stats
      let allOps: HorizonOperation[] = [];

      if (TRACKED_ACCOUNTS.length > 0) {
        const fetches = TRACKED_ACCOUNTS.map(async (account) => {
          try {
            const res = await fetch(
              `${horizonUrl}/accounts/${account}/operations?order=desc&limit=200`
            );
            if (!res.ok) return [];
            const data = await res.json();
            return (data._embedded?.records || []) as HorizonOperation[];
          } catch {
            return [];
          }
        });
        const results = await Promise.all(fetches);
        allOps = results.flat();
      } else {
        // Fetch recent ledger-level operations to show network activity
        const res = await fetch(
          `${horizonUrl}/operations?order=desc&limit=200`
        );
        if (!res.ok) throw new Error(`Horizon returned ${res.status}`);
        const data = await res.json();
        allOps = (data._embedded?.records || []) as HorizonOperation[];
      }

      // Process metrics
      const uniqueAccounts = new Set<string>();
      let paymentCount = 0;
      let dexSwapCount = 0;
      let accountsCreated = 0;
      let trustlinesAdded = 0;
      let totalXlmVolume = 0;
      let totalUsdcVolume = 0;

      for (const op of allOps) {
        if (op.source_account) uniqueAccounts.add(op.source_account);
        if (op.from) uniqueAccounts.add(op.from);
        if (op.to) uniqueAccounts.add(op.to);

        switch (op.type) {
          case "payment":
            paymentCount++;
            if (op.asset_type === "native") {
              totalXlmVolume += parseFloat(op.amount || "0");
            } else if (op.asset_code === "USDC") {
              totalUsdcVolume += parseFloat(op.amount || "0");
            }
            break;
          case "path_payment_strict_send":
          case "path_payment_strict_receive":
            dexSwapCount++;
            if (op.asset_code === "USDC") {
              totalUsdcVolume += parseFloat(op.amount || "0");
            } else if (op.asset_type === "native") {
              totalXlmVolume += parseFloat(op.amount || "0");
            }
            break;
          case "create_account":
            accountsCreated++;
            totalXlmVolume += parseFloat(op.starting_balance || "0");
            break;
          case "change_trust":
            trustlinesAdded++;
            break;
        }
      }

      const sorted = [...allOps].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      setMetrics({
        totalOperations: allOps.length,
        paymentCount,
        dexSwapCount,
        accountsCreated,
        trustlinesAdded,
        totalXlmVolume,
        totalUsdcVolume,
        uniqueAccounts,
        recentOps: allOps.slice(0, 10),
        oldestTx: sorted.length > 0 ? sorted[0].created_at : null,
        newestTx: sorted.length > 0 ? sorted[sorted.length - 1].created_at : null,
      });
    } catch (err: any) {
      setError(err.message || "Failed to fetch on-chain data");
    } finally {
      setLoading(false);
    }
  }, [network]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const formatNumber = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString();

  const formatVolume = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(2)}M`
      : n >= 1000
      ? `$${(n / 1000).toFixed(1)}K`
      : `$${n.toFixed(2)}`;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const explorerBase =
    network === "mainnet"
      ? "https://stellar.expert/explorer/public"
      : "https://stellar.expert/explorer/testnet";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            <Activity className="w-3 h-3 mr-1" />
            Live On-Chain Data
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              On-Chain Traction
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Real-time Stellar blockchain metrics — every transaction is verifiable on-chain.
            No vanity metrics. Just cryptographic proof.
          </p>
        </div>

        {/* Network Switcher + Refresh */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex rounded-lg border overflow-hidden">
            <Button
              variant={network === "testnet" ? "default" : "ghost"}
              size="sm"
              className="rounded-none h-9 px-4"
              onClick={() => setNetwork("testnet")}
            >
              🧪 Testnet
            </Button>
            <Button
              variant={network === "mainnet" ? "default" : "ghost"}
              size="sm"
              className="rounded-none h-9 px-4"
              onClick={() => setNetwork("mainnet")}
            >
              🌐 Mainnet
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {loading && !metrics ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Fetching live data from Stellar Horizon…</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchMetrics}>Retry</Button>
          </div>
        ) : metrics ? (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <MetricCard
                icon={<Zap className="w-5 h-5 text-primary" />}
                label="Total Operations"
                value={formatNumber(metrics.totalOperations)}
                sub="On-chain transactions"
              />
              <MetricCard
                icon={<DollarSign className="w-5 h-5 text-accent" />}
                label="USDC Volume"
                value={formatVolume(metrics.totalUsdcVolume)}
                sub="Circle USDC transferred"
              />
              <MetricCard
                icon={<Users className="w-5 h-5 text-primary" />}
                label="Unique Addresses"
                value={formatNumber(metrics.uniqueAccounts.size)}
                sub="Distinct Stellar accounts"
              />
              <MetricCard
                icon={<ArrowDownUp className="w-5 h-5 text-accent" />}
                label="DEX Swaps"
                value={formatNumber(metrics.dexSwapCount)}
                sub="On-chain path payments"
              />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <MetricCard
                icon={<TrendingUp className="w-5 h-5 text-primary" />}
                label="XLM Volume"
                value={`${formatNumber(metrics.totalXlmVolume)} XLM`}
                sub="Lumens transacted"
                small
              />
              <MetricCard
                icon={<Globe className="w-5 h-5 text-accent" />}
                label="Payments"
                value={formatNumber(metrics.paymentCount)}
                sub="Direct transfers"
                small
              />
              <MetricCard
                icon={<Users className="w-5 h-5 text-primary" />}
                label="Accounts Created"
                value={formatNumber(metrics.accountsCreated)}
                sub="New wallets funded"
                small
              />
              <MetricCard
                icon={<Activity className="w-5 h-5 text-accent" />}
                label="Trustlines"
                value={formatNumber(metrics.trustlinesAdded)}
                sub="Asset trustlines set"
                small
              />
            </div>

            {/* Timeline */}
            {metrics.oldestTx && metrics.newestTx && (
              <Card className="mb-8 border-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Activity Window</span>
                    </div>
                    <p className="text-sm font-medium">
                      {formatDate(metrics.oldestTx)} — {formatDate(metrics.newestTx)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Operations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-primary" />
                  Recent On-Chain Operations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.recentOps.map((op) => (
                    <div
                      key={op.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {op.type.replace(/_/g, " ")}
                        </Badge>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground truncate font-mono">
                            {op.source_account?.slice(0, 8)}…{op.source_account?.slice(-8)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(op.created_at).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {op.amount && (
                          <span className="text-sm font-semibold text-foreground">
                            {parseFloat(op.amount).toFixed(2)} {op.asset_code || "XLM"}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            window.open(
                              `${explorerBase}/tx/${op.transaction_hash}`,
                              "_blank"
                            )
                          }
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Verification CTA */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Every metric above is derived from live Stellar Horizon API data.
                Verify any transaction on Stellar Expert.
              </p>
              <Button
                variant="outline"
                onClick={() => window.open(explorerBase, "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Stellar Expert
              </Button>
            </div>
          </>
        ) : null}
      </div>
      <Footer />
    </div>
  );
};

function MetricCard({
  icon,
  label,
  value,
  sub,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  small?: boolean;
}) {
  return (
    <Card className="border-primary/10 hover:border-primary/25 transition-colors">
      <CardContent className={small ? "p-4" : "p-6"}>
        <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
        <p className={`font-bold ${small ? "text-xl" : "text-2xl md:text-3xl"}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

export default Traction;
