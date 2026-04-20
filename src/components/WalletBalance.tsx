import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WalletBalanceData {
  balance_usd: number;
  balance_usdc: number;
  updated_at: string;
  stellar_public_key: string | null;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  created_at: string;
}

export const WalletBalance = () => {
  const [balance, setBalance] = useState<WalletBalanceData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [xlmBalance, setXlmBalance] = useState<string | null>(null);
  const [onChainUsdc, setOnChainUsdc] = useState<number | null>(null);
  const { toast } = useToast();
  const { token, user } = useOmsAuth();

  const fetchWalletData = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('wallet-proxy', {
        body: { 
          action: 'get_wallet',
          omsUserId: user?.id ? String(user.id) : undefined,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (error) throw error;

      const walletData = data?.wallet;
      if (walletData) {
        setBalance(walletData);

        // Fetch live balances from Stellar Horizon — store separately, don't overwrite DB
        if (walletData.stellar_public_key) {
          try {
            const response = await fetch(
              `https://horizon-testnet.stellar.org/accounts/${walletData.stellar_public_key}`
            );
            if (response.ok) {
              const stellarData = await response.json();
              const xlmBal = stellarData.balances.find((b: any) => b.asset_type === 'native');
              if (xlmBal) {
                setXlmBalance(parseFloat(xlmBal.balance).toFixed(2));
              }
              const usdcBal = stellarData.balances.find((b: any) => b.asset_code === 'USDC');
              if (usdcBal) {
                setOnChainUsdc(parseFloat(usdcBal.balance));
              }
            }
          } catch (err) {
            console.error('Error fetching Stellar balances:', err);
          }
        }
      }

      // Fetch transactions
      const { data: txData, error: txError } = await supabase.functions.invoke('wallet-proxy', {
        body: { 
          action: 'get_transactions',
          omsUserId: user?.id ? String(user.id) : undefined,
          limit: 10,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!txError && txData?.transactions) {
        setTransactions(txData.transactions);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, toast, user?.id]);

  useEffect(() => {
    if (token) {
      fetchWalletData();
    } else {
      setIsLoading(false);
    }
  }, [token, fetchWalletData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Use the higher of DB balance or on-chain balance for USDC
  // This ensures simulated Circle deposits (DB-only) are reflected
  const effectiveUsdc = Math.max(
    balance?.balance_usdc ?? 0,
    onChainUsdc ?? 0
  );

  // Total USDC = on-chain + any DB-only excess (simulated deposits not yet on-chain)
  const dbUsdc = balance?.balance_usdc ?? 0;
  const chainUsdc = onChainUsdc ?? 0;
  const totalUsdc = chainUsdc + Math.max(0, dbUsdc - chainUsdc);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Wallet Balance</CardTitle>
            <CardDescription>Your available funds</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchWalletData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">USD Balance</p>
              <p className="text-3xl font-bold">${balance?.balance_usd?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">USDC Balance</p>
              <p className="text-3xl font-bold">{totalUsdc.toFixed(2)} USDC</p>
              {onChainUsdc !== null && dbUsdc > chainUsdc && (
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>On-chain: {chainUsdc.toFixed(2)} USDC</p>
                  <p className="text-primary">+ {(dbUsdc - chainUsdc).toFixed(2)} USDC (simulated)</p>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">XLM Balance</p>
              <p className="text-3xl font-bold">{xlmBalance || '0.00'} XLM</p>
            </div>
          </div>
          {balance?.updated_at && (
            <p className="text-xs text-muted-foreground">
              Last updated: {formatDate(balance.updated_at)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
