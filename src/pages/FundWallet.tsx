import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Building2, FileText, Loader2, Wallet, ArrowRightLeft, Copy, CheckCircle2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";

const EXTERNAL_WALLETS = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    networks: ["Ethereum", "Polygon", "Arbitrum"],
    description: "Send ETH, USDC, or USDT from MetaMask",
    color: "from-orange-500/20 to-amber-500/10",
  },
  {
    id: "phantom",
    name: "Phantom",
    icon: "👻",
    networks: ["Solana"],
    description: "Send SOL or USDC from Phantom wallet",
    color: "from-purple-500/20 to-violet-500/10",
  },
  {
    id: "trustwallet",
    name: "Trust Wallet",
    icon: "🛡️",
    networks: ["Multi-chain"],
    description: "Transfer from Trust Wallet on any supported chain",
    color: "from-blue-500/20 to-cyan-500/10",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "🔵",
    networks: ["Ethereum", "Base", "Solana"],
    description: "Send from Coinbase Wallet or Coinbase exchange",
    color: "from-blue-600/20 to-blue-400/10",
  },
  {
    id: "lobstr",
    name: "LOBSTR",
    icon: "⭐",
    networks: ["Stellar"],
    description: "Native Stellar wallet — send XLM or USDC directly",
    color: "from-sky-500/20 to-cyan-500/10",
    recommended: true,
  },
  {
    id: "freighter",
    name: "Freighter",
    icon: "🚀",
    networks: ["Stellar"],
    description: "Stellar browser extension wallet",
    color: "from-indigo-500/20 to-blue-500/10",
    recommended: true,
  },
];

const FundWallet = () => {
  const { isAuthenticated, token, isLoading: authLoading, user } = useOmsAuth();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [stellarPublicKey, setStellarPublicKey] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add funds to your wallet.",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [isAuthenticated, authLoading, navigate, toast]);

  // Fetch stellar public key for deposit address
  useEffect(() => {
    if (!isAuthenticated || !token || !user?.id) return;
    const fetchKey = async () => {
      try {
        const { data } = await supabase.functions.invoke('wallet-proxy', {
          body: { action: 'get_wallet', omsUserId: String(user.id) },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data?.wallet?.stellar_public_key) {
          setStellarPublicKey(data.wallet.stellar_public_key);
        }
      } catch {
        // Non-fatal: wallet lookup can fail transiently
      }
    };
    fetchKey();
  }, [isAuthenticated, token, user?.id]);

  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'cancelled') {
      toast({ title: "Payment Cancelled", description: "Your payment was cancelled.", variant: "destructive" });
    }
  }, [searchParams, toast]);

  const handleCardPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount greater than 0", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { amount: parseFloat(amount) * 100 },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        toast({ title: "Redirecting to Stripe", description: "Opening payment page in a new tab." });
      }
    } catch {
      toast({ title: "Payment Failed", description: "Unable to process payment. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayPalPayment = () => {
    toast({ title: "PayPal Integration", description: "PayPal payment functionality will be available soon." });
  };

  const handleACHTransfer = () => {
    toast({ title: "ACH Transfer", description: "ACH transfer functionality will be available soon." });
  };

  const copyAddress = () => {
    if (stellarPublicKey) {
      navigator.clipboard.writeText(stellarPublicKey);
      setCopiedAddress(true);
      toast({ title: "Address Copied", description: "Stellar address copied to clipboard" });
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Add Funds
          </h1>
          <p className="text-muted-foreground mt-2">
            Choose your preferred funding method — card, bank, or crypto wallet
          </p>
        </div>

        <Tabs defaultValue="card" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="card">
              <CreditCard className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Stripe</span>
            </TabsTrigger>
            <TabsTrigger value="wallets">
              <ArrowRightLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Wallets</span>
            </TabsTrigger>
            <TabsTrigger value="paypal">
              <Wallet className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">PayPal</span>
            </TabsTrigger>
            <TabsTrigger value="ach">
              <Building2 className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Bank</span>
            </TabsTrigger>
            <TabsTrigger value="wire">
              <FileText className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Wire</span>
            </TabsTrigger>
          </TabsList>

          {/* Stripe Tab */}
          <TabsContent value="card">
            <Card>
              <CardHeader>
                <CardTitle>Stripe Payment</CardTitle>
                <CardDescription>Secure payment via Stripe — accepts Visa, Mastercard, and American Express</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card-amount">Amount (USD)</Label>
                  <Input id="card-amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" />
                </div>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processing Fee (2.9% + $0.30)</span>
                    <span className="font-medium">${amount ? ((parseFloat(amount) * 0.029) + 0.30).toFixed(2) : '0.00'}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${amount ? (parseFloat(amount) + (parseFloat(amount) * 0.029) + 0.30).toFixed(2) : '0.00'}</span>
                  </div>
                </div>
                <Button onClick={handleCardPayment} disabled={isLoading || !amount} className="w-full">
                  {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>) : 'Continue to Payment'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* External Wallets Tab */}
          <TabsContent value="wallets">
            <div className="space-y-6">
              {/* Deposit Address Card */}
              {stellarPublicKey && (
                <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span>Your Stellar Deposit Address</span>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500 text-xs">Active</Badge>
                    </CardTitle>
                    <CardDescription>Send XLM or USDC on the Stellar network to this address</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono break-all">
                        {stellarPublicKey}
                      </code>
                      <Button variant="outline" size="icon" onClick={copyAddress}>
                        {copiedAddress ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      ⚠️ Only send Stellar-native assets (XLM, USDC) to this address. Do not send ERC-20 or SPL tokens directly.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Wallet Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXTERNAL_WALLETS.map((wallet) => (
                  <Card key={wallet.id} className={`relative overflow-hidden bg-gradient-to-br ${wallet.color} border-border/50 hover:border-primary/40 transition-colors`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{wallet.icon}</span>
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              {wallet.name}
                              {wallet.recommended && (
                                <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px]">Recommended</Badge>
                              )}
                            </h3>
                            <p className="text-xs text-muted-foreground">{wallet.description}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {wallet.networks.map((net) => (
                          <Badge key={net} variant="outline" className="text-[10px] px-1.5 py-0">{net}</Badge>
                        ))}
                      </div>

                      {wallet.id === "lobstr" || wallet.id === "freighter" ? (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Send XLM or USDC directly to your InveStar Stellar address above.
                          </p>
                          {wallet.id === "lobstr" && (
                            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => window.open('https://lobstr.co', '_blank')}>
                              <ExternalLink className="w-3 h-3 mr-1" /> Open LOBSTR
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Bridge from {wallet.networks.join("/")} to Stellar via a cross-chain bridge, then send USDC to your deposit address.
                          </p>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => window.open('https://app.allbridge.io', '_blank')}>
                              <ExternalLink className="w-3 h-3 mr-1" /> Allbridge
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => {
                              if (stellarPublicKey) {
                                copyAddress();
                              } else {
                                toast({ title: "No Wallet", description: "Create a wallet first from the Wallet page.", variant: "destructive" });
                              }
                            }}>
                              <Copy className="w-3 h-3 mr-1" /> Copy Address
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Cross-chain Info */}
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <ArrowRightLeft className="w-5 h-5 text-primary mt-0.5" />
                    <div className="text-sm space-y-1">
                      <p className="font-medium">How Cross-Chain Funding Works</p>
                      <p className="text-muted-foreground text-xs">
                        For non-Stellar wallets (MetaMask, Phantom, etc.), you can bridge your assets to the Stellar network
                        using <a href="https://app.allbridge.io" target="_blank" rel="noopener noreferrer" className="text-primary underline">Allbridge</a> or
                        similar bridges. Once bridged, send USDC or XLM to your InveStar Stellar address. Stellar wallets (LOBSTR, Freighter)
                        can send directly — no bridge needed.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* PayPal Tab */}
          <TabsContent value="paypal">
            <Card>
              <CardHeader>
                <CardTitle>PayPal</CardTitle>
                <CardDescription>Fast and secure payments through your PayPal account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paypal-amount">Amount (USD)</Label>
                  <Input id="paypal-amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" />
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Benefits:</p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Instant funding</li>
                    <li>Buyer protection</li>
                    <li>No need to share card details</li>
                  </ul>
                </div>
                <Button onClick={handlePayPalPayment} disabled={!amount} className="w-full bg-[#0070ba] hover:bg-[#005ea6]">
                  Continue with PayPal
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACH Tab */}
          <TabsContent value="ach">
            <Card>
              <CardHeader>
                <CardTitle>ACH Bank Transfer</CardTitle>
                <CardDescription>Free transfers from your US bank account (3-5 business days)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ach-amount">Amount (USD)</Label>
                  <Input id="ach-amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" />
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Benefits:</p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>No processing fees</li>
                    <li>Higher transfer limits</li>
                    <li>Secure bank-to-bank transfer</li>
                  </ul>
                </div>
                <Button onClick={handleACHTransfer} disabled={!amount} className="w-full">Connect Bank Account</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wire Tab */}
          <TabsContent value="wire">
            <Card>
              <CardHeader>
                <CardTitle>Wire Transfer</CardTitle>
                <CardDescription>Large deposits via domestic or international wire (1-2 business days)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h3 className="font-semibold">Wire Instructions</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Bank Name:</span><p className="font-medium">Available after account verification</p></div>
                    <div><span className="text-muted-foreground">Account Number:</span><p className="font-medium">Contact support for details</p></div>
                    <div><span className="text-muted-foreground">Routing Number:</span><p className="font-medium">Contact support for details</p></div>
                    <div><span className="text-muted-foreground">SWIFT Code:</span><p className="font-medium">For international transfers</p></div>
                  </div>
                </div>
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                  <p className="text-sm">
                    <span className="font-semibold">Note:</span> Please include your InveStar account ID in the wire reference.
                    Contact support at hello@investarbd.com for complete wire instructions.
                  </p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = 'mailto:hello@investarbd.com?subject=Wire Transfer Instructions'}>
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FundWallet;
