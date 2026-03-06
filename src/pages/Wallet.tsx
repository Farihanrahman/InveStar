import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDownRight, Plus, Loader2 } from "lucide-react";
import { WalletBalance } from "@/components/WalletBalance";
import { BackendStellarWallet } from "@/components/BackendStellarWallet";
import { USDCTransfer } from "@/components/USDCTransfer";
import { FiatRamp } from "@/components/FiatRamp";
import { NetworkSwitcher, DexSwap, WalletConnectButton } from "@/components/stellar";
import type { StellarNetwork } from "@/components/stellar";
import { supabase } from "@/integrations/supabase/client";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";
import { useToast } from "@/hooks/use-toast";

interface ConnectedExternalWallet {
  name: string;
  publicKey: string;
}

const Wallet = () => {
  const { isAuthenticated, user, isLoading, token } = useOmsAuth();
  const [stellarPublicKey, setStellarPublicKey] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [network, setNetwork] = useState<StellarNetwork>("testnet");
  const [externalWallet, setExternalWallet] = useState<ConnectedExternalWallet | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const userName = user?.full_name as string | undefined || 
                   (user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}`.trim() : undefined) ||
                   user?.name as string | undefined || 
                   user?.user_name as string | undefined ||
                   user?.email?.split('@')[0] || 
                   'User';
  const userEmail = user?.email || null;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
      return;
    }

    if (isAuthenticated && user?.id && token) {
      const checkWallet = async () => {
        setWalletLoading(true);
        try {
          const { data, error } = await supabase.functions.invoke('wallet-proxy', {
            body: { 
              action: 'get_wallet',
              omsUserId: String(user.id),
            },
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!error && data?.wallet?.stellar_public_key) {
            setStellarPublicKey(data.wallet.stellar_public_key);
          }
        } catch (err) {
          console.error('Error checking wallet:', err);
        } finally {
          setWalletLoading(false);
        }
      };
      checkWallet();
    } else {
      setWalletLoading(false);
    }
  }, [isAuthenticated, isLoading, navigate, user, token]);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const payment = searchParams.get('payment');
      const sessionId = searchParams.get('session_id');

      if (payment === 'success' && sessionId) {
        try {
          const { data, error } = await supabase.functions.invoke('verify-payment', {
            body: { sessionId },
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          if (error) throw error;

          if (data.success) {
            toast({
              title: "Payment Successful!",
              description: `$${data.amount} has been added to your wallet.`,
            });
            window.location.href = '/wallet';
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          toast({
            title: "Verification Error",
            description: "Please contact support if funds were not added.",
            variant: "destructive",
          });
        }
      }
    };

    handlePaymentSuccess();
  }, [searchParams, toast, token]);

  if (!isAuthenticated) {
    return null;
  }

  // Use external wallet public key if connected, otherwise backend wallet
  const activePublicKey = externalWallet?.publicKey || stellarPublicKey;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">
              Welcome back, <span className="text-primary font-medium">{userName}</span>
            </p>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Your Wallet
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NetworkSwitcher network={network} onNetworkChange={setNetwork} />
            <WalletConnectButton
              connectedWallet={externalWallet}
              onConnect={(w) => setExternalWallet(w)}
              onDisconnect={() => setExternalWallet(null)}
            />
            <Link to="/fund-wallet">
              <Button size="lg" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Funds
              </Button>
            </Link>
          </div>
        </div>

        {/* External wallet badge */}
        {externalWallet && (
          <Card className="p-4 mb-6 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3">
              <span className="text-lg">🔗</span>
              <div className="flex-1">
                <p className="text-sm font-medium">External Wallet: {externalWallet.name}</p>
                <code className="text-xs text-muted-foreground">{externalWallet.publicKey}</code>
              </div>
            </div>
          </Card>
        )}

        <WalletBalance />

        {walletLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {!stellarPublicKey && (
              <Card className="p-6 mt-6 text-center">
                <h2 className="text-xl font-semibold mb-2">Stellar Wallet</h2>
                <p className="text-muted-foreground mb-4">
                  Create a Stellar {network} wallet to enable USDC transfers and DEX swaps
                </p>
                <CreateWalletButton 
                  token={token} 
                  omsUserId={String(user?.id)} 
                  onCreated={(pk) => setStellarPublicKey(pk)} 
                />
              </Card>
            )}

            <BackendStellarWallet 
              publicKey={stellarPublicKey} 
              onWalletRegenerated={(pk) => setStellarPublicKey(pk)}
            />

            <USDCTransfer publicKey={activePublicKey} />
            <DexSwap publicKey={activePublicKey} network={network} />
            <FiatRamp publicKey={activePublicKey} />
          </>
        )}

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
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Receive
            </Button>
          </div>
        </Card>

        {/* Recent Transactions */}
        <RecentTransactionsCard token={token} userId={user?.id ? String(user.id) : undefined} />
      </div>
    </div>
  );
};

function CreateWalletButton({ token, omsUserId, onCreated }: { token: string | null; omsUserId: string; onCreated: (pk: string) => void }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stellar-wallet', {
        body: { action: 'create', omsUserId },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (error) throw error;

      if (data?.publicKey) {
        toast({
          title: "Wallet Created!",
          description: data.testnetFunded 
            ? "Your Stellar wallet has been created and funded with testnet XLM!" 
            : "Your Stellar wallet has been created.",
        });
        onCreated(data.publicKey);
      }
    } catch (error: any) {
      console.error('Error creating wallet:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create wallet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleCreate} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Creating Wallet...
        </>
      ) : (
        <>
          <Plus className="w-4 h-4 mr-2" />
          Create Stellar Wallet
        </>
      )}
    </Button>
  );
}

function RecentTransactionsCard({ token, userId }: { token: string | null; userId: string | undefined }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    const fetchTx = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('wallet-proxy', {
          body: { action: 'get_transactions', omsUserId: userId, limit: 10 },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!error && data?.transactions) setTransactions(data.transactions);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchTx();
  }, [token, userId]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <Card className="p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : transactions.length === 0 ? (
        <p className="text-center text-muted-foreground py-6">No transactions yet. Add funds to get started!</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx: any) => (
            <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${tx.type === 'deposit' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  {tx.type === 'deposit' ? <ArrowDownRight className="w-4 h-4 text-green-500" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                </div>
                <div>
                  <p className="font-medium capitalize">{tx.type}</p>
                  <p className="text-sm text-muted-foreground">{tx.payment_method?.toUpperCase() || 'Unknown'} • {formatDate(tx.created_at)}</p>
                </div>
              </div>
              <p className="font-semibold">{tx.type === 'deposit' ? '+' : '-'}${tx.amount} {tx.currency}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default Wallet;
