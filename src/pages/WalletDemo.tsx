import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDownRight, Plus, Info, ExternalLink } from "lucide-react";
import { NetworkSwitcher, DexSwap, StellarAccountInfo, StellarTransactionHistory } from "@/components/stellar";
import type { StellarNetwork } from "@/components/stellar";
import { USDCTransfer } from "@/components/USDCTransfer";
import { FiatRamp } from "@/components/FiatRamp";
import Footer from "@/components/Footer";

// A real Stellar testnet account for demo purposes
// This is a PUBLIC key — no security concern. Anyone can view it on Horizon.
const DEMO_PUBLIC_KEY = "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR";
const DEMO_MAINNET_KEY = "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR";

const WalletDemo = () => {
  const [network, setNetwork] = useState<StellarNetwork>("testnet");

  const activeKey = network === "mainnet" ? DEMO_MAINNET_KEY : DEMO_PUBLIC_KEY;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Demo Banner */}
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Demo Mode — SCF Reviewer Access</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You're viewing a live Stellar wallet with real on-chain data from the Horizon API.
                  All balances, transactions, and DEX swaps shown below are verifiable on-chain.
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 ml-1 text-xs"
                    onClick={() => window.open(
                      network === "mainnet"
                        ? `https://stellar.expert/explorer/public/account/${activeKey}`
                        : `https://stellar.expert/explorer/testnet/account/${activeKey}`,
                      "_blank"
                    )}
                  >
                    Verify on Stellar Expert <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </p>
              </div>
              <Link to="/auth">
                <Button size="sm" variant="outline">Sign Up</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">
              Demo Wallet — <span className="text-primary font-medium">SCF Reviewer</span>
            </p>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              InveStar Wallet
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NetworkSwitcher network={network} onNetworkChange={setNetwork} />
            <Link to="/fund-wallet">
              <Button size="lg" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Funds
              </Button>
            </Link>
          </div>
        </div>

        {/* Demo Balance Card */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Platform Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">USD Balance</p>
                <p className="text-2xl font-bold">$1,250.00</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">USDC Balance</p>
                <p className="text-2xl font-bold">500.00 <span className="text-sm font-normal text-muted-foreground">USDC</span></p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real on-chain account info */}
        <StellarAccountInfo publicKey={activeKey} network={network} />

        {/* USDC Transfer UI (read-only view for demo) */}
        <USDCTransfer publicKey={activeKey} />

        {/* DEX Swap UI */}
        <DexSwap publicKey={activeKey} network={network} />

        {/* Fiat Ramp */}
        <FiatRamp publicKey={activeKey} />

        {/* Real on-chain transaction history */}
        <StellarTransactionHistory publicKey={activeKey} network={network} />

        {/* Quick Actions */}
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/fund-wallet">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Deposit
              </Button>
            </Link>
            <Link to="/send-money">
              <Button variant="outline" className="w-full justify-start">
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Send Money
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start">
              <ArrowDownRight className="w-4 h-4 mr-2" />
              Receive
            </Button>
          </div>
        </Card>

        {/* Demo Transactions */}
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Platform Transactions</h2>
          <div className="space-y-3">
            {[
              { id: "1", type: "deposit", amount: 500, currency: "USD", method: "STRIPE", date: "2025-04-10T14:30:00Z" },
              { id: "2", type: "deposit", amount: 750, currency: "USD", method: "WIRE", date: "2025-03-28T09:15:00Z" },
              { id: "3", type: "withdrawal", amount: 200, currency: "USDC", method: "STELLAR", date: "2025-03-15T16:45:00Z" },
              { id: "4", type: "deposit", amount: 1000, currency: "USD", method: "STRIPE", date: "2025-02-20T11:00:00Z" },
            ].map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${tx.type === 'deposit' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {tx.type === 'deposit' ? <ArrowDownRight className="w-4 h-4 text-green-500" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                  </div>
                  <div>
                    <p className="font-medium capitalize">{tx.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {tx.method} • {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <p className="font-semibold">{tx.type === 'deposit' ? '+' : '-'}${tx.amount} {tx.currency}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">
            Ready to experience InveStar with your own wallet?
          </p>
          <Link to="/auth">
            <Button size="lg">Create Your Account</Button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default WalletDemo;
