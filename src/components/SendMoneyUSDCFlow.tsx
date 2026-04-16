import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";
import { useToast } from "@/hooks/use-toast";
import { useConfetti } from "@/hooks/useConfetti";
import { supabase } from "@/integrations/supabase/client";
import { FiatRamp } from "@/components/FiatRamp";
import { UsdtIntake } from "@/components/UsdtIntake";
import { BtcInvestment } from "@/components/BtcInvestment";
import {
  Send,
  User,
  Wallet,
  Contact,
  Loader2,
  ArrowRight,
  Copy,
  CheckCircle,
  Smartphone,
  Building2,
  Globe,
  Plus,
  ArrowDownUp,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Clock,
  PartyPopper,
} from "lucide-react";

type ReceiverMethod = "stellar" | "bank" | "mobile" | null;

interface ReceiverDetails {
  method: ReceiverMethod;
  stellarAddress?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  mobileProvider?: string;
  mobileNumber?: string;
}

interface SendMoneyUSDCFlowProps {
  amount: string;
  onBack: () => void;
  investmentAmount?: number;
}

type SendCurrency = "XLM" | "USD" | "USDC" | "USDT";

const SendMoneyUSDCFlow = ({ amount, onBack, investmentAmount = 0 }: SendMoneyUSDCFlowProps) => {
  const { triggerConfetti } = useConfetti();
  const [activeTab, setActiveTab] = useState<"sender" | "receiver">("sender");
  const [walletBalance, setWalletBalance] = useState<{
    usd: number; usdc: number; xlm: number; publicKey: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { token, user } = useOmsAuth();
  const { toast } = useToast();

  // Send currency selection
  const [sendCurrency, setSendCurrency] = useState<SendCurrency>("USDC");
  const [sendAmount, setSendAmount] = useState(amount);

  // Receiver state
  const [receiverMethod, setReceiverMethod] = useState<ReceiverMethod>(null);
  const [receiver, setReceiver] = useState<ReceiverDetails>({ method: null });
  const [addressError, setAddressError] = useState("");

  // DEX Swap state
  const [showDexSwap, setShowDexSwap] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [showUsdtIntake, setShowUsdtIntake] = useState(false);
  const [showBtcInvest, setShowBtcInvest] = useState(false);
  const [swapFrom, setSwapFrom] = useState<"XLM" | "USDC">("XLM");
  const [swapAmount, setSwapAmount] = useState("");
  const [swapQuote, setSwapQuote] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [swapping, setSwapping] = useState(false);

  // Transfer completion state
  interface CompletedTransfer {
    id: string;
    amount: number;
    currency: SendCurrency;
    receiverMethod: ReceiverMethod;
    receiverDetails: ReceiverDetails;
    timestamp: string;
    investmentAmount: number;
  }
  const [completedTransfer, setCompletedTransfer] = useState<CompletedTransfer | null>(null);
  const [transferHistory, setTransferHistory] = useState<CompletedTransfer[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("send_money_history") || "[]");
    } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);

  // Computed: amount receiver gets after investment deduction
  const parsedSendAmount = parseFloat(sendAmount) || 0;
  const receiverGets = Math.max(0, parsedSendAmount - investmentAmount);

  const getAvailableBalance = (currency: SendCurrency) => {
    if (!walletBalance) return 0;
    if (currency === "XLM") return walletBalance.xlm;
    if (currency === "USD") return walletBalance.usd;
    if (currency === "USDT") return 0; // USDT is external — no local balance
    return walletBalance.usdc;
  };

  const getCurrencySymbol = (currency: SendCurrency) => {
    if (currency === "USD") return "$";
    if (currency === "USDC") return "";
    return "";
  };

  const fetchBalance = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const { data, error } = await supabase.functions.invoke("wallet-proxy", {
        body: { action: "get_wallet", omsUserId: String(user.id) },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!error && data?.wallet) {
        const wallet = data.wallet;
        let xlm = 0;
        let usdc = wallet.balance_usdc || 0;

        // Fetch live Stellar balances
        if (wallet.stellar_public_key) {
          try {
            const res = await fetch(
              `https://horizon-testnet.stellar.org/accounts/${wallet.stellar_public_key}`
            );
            if (res.ok) {
              const stellarData = await res.json();
              const xlmBal = stellarData.balances.find((b: any) => b.asset_type === "native");
              if (xlmBal) xlm = parseFloat(xlmBal.balance);
              const usdcBal = stellarData.balances.find((b: any) => b.asset_code === "USDC");
              if (usdcBal) usdc = parseFloat(usdcBal.balance);
            }
          } catch (e) { console.error("Stellar fetch error:", e); }
        }

        setWalletBalance({
          usd: wallet.balance_usd || 0,
          usdc,
          xlm,
          publicKey: wallet.stellar_public_key || null,
        });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user, token]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  const handleCopyAddress = () => {
    if (walletBalance?.publicKey) {
      navigator.clipboard.writeText(walletBalance.publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStellarAddressChange = (value: string) => {
    setReceiver(prev => ({ ...prev, stellarAddress: value }));
    if (value.length > 0 && !value.startsWith("G")) {
      setAddressError("Must start with G");
    } else if (value.length > 10 && value.length !== 56) {
      setAddressError("Must be exactly 56 characters");
    } else {
      setAddressError("");
    }
  };

  const handleSend = () => {
    const transfer: CompletedTransfer = {
      id: `TXN-${Date.now().toString(36).toUpperCase()}`,
      amount: receiverGets,
      currency: sendCurrency,
      receiverMethod,
      receiverDetails: { ...receiver },
      timestamp: new Date().toISOString(),
      investmentAmount,
    };
    setCompletedTransfer(transfer);
    const updatedHistory = [transfer, ...transferHistory].slice(0, 50);
    setTransferHistory(updatedHistory);
    localStorage.setItem("send_money_history", JSON.stringify(updatedHistory));
    triggerConfetti('buy');
    toast({ title: "Transfer Successful! 🎉", description: `${receiverGets.toFixed(2)} ${sendCurrency} sent successfully.` });
  };

  const getReceiverLabel = (t: CompletedTransfer) => {
    if (t.receiverMethod === "stellar") return `Stellar: ${t.receiverDetails.stellarAddress?.slice(0, 8)}...`;
    if (t.receiverMethod === "bank") return `Bank: ${t.receiverDetails.accountHolder || ""}`;
    if (t.receiverMethod === "mobile") return `${t.receiverDetails.mobileProvider}: ${t.receiverDetails.mobileNumber}`;
    return "Unknown";
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const truncateKey = (key: string) => `${key.slice(0, 8)}...${key.slice(-8)}`;

  const isReceiverValid = () => {
    if (receiverMethod === "stellar") return receiver.stellarAddress?.length === 56 && !addressError;
    if (receiverMethod === "bank") return receiver.accountNumber && receiver.accountHolder;
    if (receiverMethod === "mobile") return receiver.mobileNumber && receiver.mobileProvider;
    return false;
  };

  // DEX Swap handlers
  const swapTo = swapFrom === "XLM" ? "USDC" : "XLM";

  const handleGetQuote = async () => {
    if (!swapAmount || parseFloat(swapAmount) <= 0) return;
    setQuoting(true);
    setSwapQuote(null);
    try {
      const { data, error } = await supabase.functions.invoke("stellar-dex-swap", {
        body: {
          action: "quote",
          network: "testnet",
          omsUserId: user?.id ? String(user.id) : undefined,
          sourceAsset: swapFrom,
          destAsset: swapTo,
          amount: swapAmount,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!error && data?.destAmount) {
        setSwapQuote(data.destAmount);
      } else {
        toast({ title: "No quote available", description: "Try a different amount.", variant: "destructive" });
      }
    } catch (e) { console.error(e); }
    finally { setQuoting(false); }
  };

  const handleSwap = async () => {
    if (!swapAmount || !swapQuote) return;
    setSwapping(true);
    try {
      const { data, error } = await supabase.functions.invoke("stellar-dex-swap", {
        body: {
          action: "swap",
          network: "testnet",
          omsUserId: user?.id ? String(user.id) : undefined,
          sourceAsset: swapFrom,
          destAsset: swapTo,
          amount: swapAmount,
          slippage: 1,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!error && data?.success) {
        toast({ title: "Swap Successful! ✅", description: `Swapped ${swapAmount} ${swapFrom} → ${swapQuote} ${swapTo}` });
        setSwapAmount("");
        setSwapQuote(null);
        fetchBalance();
      } else {
        toast({ title: "Swap Failed", description: data?.error || "Please try again.", variant: "destructive" });
      }
    } catch (e) { console.error(e); }
    finally { setSwapping(false); }
  };

  return (
    <div className="space-y-4">
      {/* ===== COMPLETED TRANSFER RECEIPT ===== */}
      {completedTransfer ? (
        <div className="space-y-4 animate-fade-in">
          <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-primary/5">
            <CardContent className="p-6 space-y-5">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-green-500">Transfer Complete!</h2>
                <p className="text-sm text-muted-foreground">Your money is on its way</p>
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-muted/50 border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono font-medium">{completedTransfer.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Sent</span>
                  <span className="font-semibold">{completedTransfer.amount.toFixed(2)} {completedTransfer.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recipient</span>
                  <span className="font-medium">{getReceiverLabel(completedTransfer)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Method</span>
                  <Badge variant="outline" className="capitalize">{completedTransfer.receiverMethod}</Badge>
                </div>
                {completedTransfer.investmentAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Invested</span>
                    <span className="text-green-500 font-medium">${completedTransfer.investmentAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span>{formatDate(completedTransfer.timestamp)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => {
                  setCompletedTransfer(null);
                  setReceiverMethod(null);
                  setReceiver({ method: null });
                  setSendAmount(amount);
                  setActiveTab("sender");
                }}>
                  Send Another
                </Button>
                <Button className="flex-1" onClick={onBack}>
                  Done
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transfer History */}
          {transferHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Transfer History
                  <Badge variant="secondary" className="text-[10px]">{transferHistory.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {transferHistory.slice(0, showHistory ? 50 : 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border text-sm">
                    <div className="space-y-0.5">
                      <p className="font-medium">{tx.amount.toFixed(2)} {tx.currency}</p>
                      <p className="text-xs text-muted-foreground">{getReceiverLabel(tx)}</p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <Badge variant="outline" className="text-green-500 border-green-500/30 text-[10px]">Completed</Badge>
                      <p className="text-[10px] text-muted-foreground">{formatDate(tx.timestamp)}</p>
                    </div>
                  </div>
                ))}
                {transferHistory.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setShowHistory(!showHistory)}>
                    {showHistory ? "Show Less" : `Show All (${transferHistory.length})`}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <>
      {/* Back + Title */}
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
        <div>
          <h2 className="text-xl font-bold">Send {sendAmount} {sendCurrency}</h2>
          <p className="text-sm text-muted-foreground">via InveStar Wallet</p>
        </div>
      </div>

      {/* Two Square Tabs */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setActiveTab("sender")}
          className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 transition-all duration-200 ${
            activeTab === "sender"
              ? "border-primary bg-primary/10 shadow-md"
              : "border-border bg-card hover:border-primary/40 hover:bg-accent/5"
          }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            activeTab === "sender" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            <Send className="w-5 h-5" />
          </div>
          <span className="font-semibold text-sm">SENDER</span>
          <span className="text-xs text-muted-foreground">Your wallet</span>
          {activeTab === "sender" && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("receiver")}
          className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 transition-all duration-200 ${
            activeTab === "receiver"
              ? "border-primary bg-primary/10 shadow-md"
              : "border-border bg-card hover:border-primary/40 hover:bg-accent/5"
          }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            activeTab === "receiver" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            <User className="w-5 h-5" />
          </div>
          <span className="font-semibold text-sm">RECEIVER</span>
          <span className="text-xs text-muted-foreground">Who gets it</span>
          {activeTab === "receiver" && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {/* ===== SENDER TAB ===== */}
      {activeTab === "sender" && (
        <div className="space-y-4">
          <Card className="border-primary/20">
            <CardContent className="p-5 space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : walletBalance ? (
                <>
                  {/* Available Balance Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Available Balance</h3>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setLoading(true); fetchBalance(); }}>
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Choose Currency to Send */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Select currency to send</p>
                    <div className="grid grid-cols-4 gap-2">
                      {([
                        { key: "XLM" as SendCurrency, label: "XLM", sub: "Stellar", value: walletBalance.xlm },
                        { key: "USD" as SendCurrency, label: "USD", sub: "Bank", value: walletBalance.usd },
                        { key: "USDC" as SendCurrency, label: "USDC", sub: "Wallet", value: walletBalance.usdc },
                        { key: "USDT" as SendCurrency, label: "USDT", sub: "Multi-Chain", value: 0 },
                      ]).map(({ key, label, sub, value }) => (
                        <button
                          key={key}
                          onClick={() => setSendCurrency(key)}
                          className={`p-2.5 rounded-lg border-2 text-center transition-all ${
                            sendCurrency === key
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-border bg-accent/10 hover:border-primary/40"
                          }`}
                        >
                          <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                          <p className="text-base font-bold">{label === "USD" ? "$" : ""}{key === "USDT" ? "—" : value.toFixed(2)}</p>
                          <Badge variant={sendCurrency === key ? "default" : "secondary"} className="text-[8px] mt-1">{sub}</Badge>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Send Amount Input */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Amount to Send ({sendCurrency})</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      className="text-xl h-12 font-semibold"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Available: {sendCurrency === "USD" ? "$" : ""}{getAvailableBalance(sendCurrency).toFixed(2)} {sendCurrency}</span>
                      {investmentAmount > 0 && (
                        <span className="text-green-500">Investing: ${investmentAmount.toFixed(2)}</span>
                      )}
                    </div>
                    {parsedSendAmount > getAvailableBalance(sendCurrency) && (
                      <p className="text-xs text-destructive">Insufficient {sendCurrency} balance</p>
                    )}
                  </div>

                  {/* Investment Balance - shown when user selected investment % */}
                  {investmentAmount > 0 && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Investment Balance</p>
                        <p className="text-lg font-bold text-green-500">${investmentAmount.toFixed(2)}</p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-[9px]">Invest Tab</Badge>
                    </div>
                  )}

                  {/* Wallet address */}
                  {walletBalance.publicKey && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                      <Wallet className="w-4 h-4 text-muted-foreground shrink-0" />
                      <code className="text-xs flex-1 truncate">{truncateKey(walletBalance.publicKey)}</code>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyAddress}>
                        {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  )}

                  {/* Add Funds / Convert / USDT / BTC */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="gap-1.5 h-11 text-xs"
                      onClick={() => window.location.href = "/fund-wallet"}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Funds
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-1.5 h-11 text-xs"
                      onClick={() => { setShowConvert(!showConvert); setShowUsdtIntake(false); setShowBtcInvest(false); }}
                    >
                      <DollarSign className="w-3.5 h-3.5" /> USD ↔ USDC
                    </Button>
                    <Button
                      variant={showUsdtIntake ? "default" : "outline"}
                      className="gap-1.5 h-11 text-xs"
                      onClick={() => { setShowUsdtIntake(!showUsdtIntake); setShowConvert(false); setShowBtcInvest(false); }}
                    >
                      <ArrowDownUp className="w-3.5 h-3.5" /> USDT → USDC
                    </Button>
                    <Button
                      variant={showBtcInvest ? "default" : "outline"}
                      className="gap-1.5 h-11 text-xs border-orange-500/30 hover:border-orange-500/60"
                      onClick={() => { setShowBtcInvest(!showBtcInvest); setShowConvert(false); setShowUsdtIntake(false); }}
                    >
                      <TrendingUp className="w-3.5 h-3.5" /> Invest in ₿
                    </Button>
                  </div>

                  {/* Fiat Ramp - Convert USD ↔ USDC */}
                  {showConvert && walletBalance.publicKey && (
                    <FiatRamp
                      publicKey={walletBalance.publicKey}
                      availableUsdc={walletBalance.usdc}
                      onBalanceUpdate={() => { setLoading(true); fetchBalance(); }}
                    />
                  )}

                  {/* USDT Intake - Fund with USDT */}
                  {showUsdtIntake && walletBalance.publicKey && (
                    <UsdtIntake
                      publicKey={walletBalance.publicKey}
                      onBalanceUpdate={() => { setLoading(true); fetchBalance(); }}
                    />
                  )}

                  {/* Bitcoin Investment */}
                  {showBtcInvest && walletBalance.publicKey && (
                    <BtcInvestment
                      publicKey={walletBalance.publicKey}
                      availableUsdc={walletBalance.usdc}
                      onBalanceUpdate={() => { setLoading(true); fetchBalance(); }}
                    />
                  )}

                  {!walletBalance.publicKey && (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-2">No Stellar wallet found</p>
                      <Button size="sm" onClick={() => window.location.href = "/wallet"}>
                        Create Wallet
                      </Button>
                    </div>
                  )}

                  <div className="pt-1">
                    <Button
                      className="w-full h-11"
                      onClick={() => setActiveTab("receiver")}
                    >
                      Continue to Receiver <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm">No wallet found.</p>
                  <Button size="sm" className="mt-2" onClick={() => window.location.href = "/wallet"}>
                    Set Up Wallet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* DEX Swap Section */}
          {walletBalance?.publicKey && (
            <Card className="border-border">
              <CardContent className="p-5 space-y-3">
                <button
                  onClick={() => setShowDexSwap(!showDexSwap)}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-2">
                    <ArrowDownUp className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm">DEX Swap</span>
                    <Badge variant="secondary" className="text-[9px]">XLM ↔ USDC</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{showDexSwap ? "Hide" : "Show"}</span>
                </button>

                {showDexSwap && (
                  <div className="space-y-3 pt-2 border-t">
                    {/* Swap direction toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setSwapFrom("XLM"); setSwapQuote(null); }}
                        className={`flex-1 p-2 rounded-lg border-2 text-xs font-medium text-center transition-all ${
                          swapFrom === "XLM" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                        }`}
                      >
                        XLM → USDC
                      </button>
                      <button
                        onClick={() => { setSwapFrom("USDC"); setSwapQuote(null); }}
                        className={`flex-1 p-2 rounded-lg border-2 text-xs font-medium text-center transition-all ${
                          swapFrom === "USDC" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                        }`}
                      >
                        USDC → XLM
                      </button>
                    </div>

                    {/* Amount input */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Amount ({swapFrom})</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={swapAmount}
                          onChange={(e) => { setSwapAmount(e.target.value); setSwapQuote(null); }}
                          className="text-sm"
                        />
                        <Button size="sm" variant="outline" onClick={handleGetQuote} disabled={quoting || !swapAmount}>
                          {quoting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Quote"}
                        </Button>
                      </div>
                    </div>

                    {/* Quote result */}
                    {swapQuote && (
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                        <p className="text-xs text-muted-foreground">You'll receive approximately</p>
                         <p className="text-lg font-bold text-green-500">
                           {parseFloat(swapQuote).toFixed(4)} {swapTo}
                        </p>
                        <Button
                          size="sm"
                          className="mt-2 w-full gap-1"
                          onClick={handleSwap}
                          disabled={swapping}
                        >
                          {swapping ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowDownUp className="w-3 h-3" />}
                          {swapping ? "Swapping..." : "Confirm Swap"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ===== RECEIVER TAB ===== */}
      {activeTab === "receiver" && (
        <Card className="border-primary/20">
          <CardContent className="p-5 space-y-4">
            {/* Receiver Gets Summary */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Receiver Will Get</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-primary">
                  {sendCurrency === "USD" ? "$" : ""}{receiverGets.toFixed(2)}
                </p>
                <span className="text-sm font-medium text-muted-foreground">{sendCurrency}</span>
              </div>
              {investmentAmount > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Sending {sendCurrency === "USD" ? "$" : ""}{parsedSendAmount.toFixed(2)}</span>
                  <span className="text-muted-foreground">−</span>
                  <span className="text-green-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    ${investmentAmount.toFixed(2)} invested
                  </span>
                </div>
              )}
              {investmentAmount <= 0 && (
                <p className="text-xs text-muted-foreground">Full amount — no investment deducted</p>
              )}
            </div>

            {/* Choose from contacts */}
            <Button variant="outline" className="w-full gap-2 h-12 justify-start" onClick={() => {
              toast({ title: "Contacts", description: "Contact picker coming soon! Add a receiver manually below." });
            }}>
              <Contact className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Choose from Contacts</p>
                <p className="text-xs text-muted-foreground">Select a saved recipient</p>
              </div>
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or add new receiver</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Add receiver method selection */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "stellar" as ReceiverMethod, label: "Stellar Wallet", icon: Globe },
                { id: "bank" as ReceiverMethod, label: "Bank Account", icon: Building2 },
                { id: "mobile" as ReceiverMethod, label: "Mobile Wallet", icon: Smartphone },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setReceiverMethod(id); setReceiver({ method: id }); }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center ${
                    receiverMethod === id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-medium leading-tight">{label}</span>
                </button>
              ))}
            </div>

            {/* Stellar Wallet form */}
            {receiverMethod === "stellar" && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs">Recipient Stellar Address</Label>
                  <Input
                    placeholder="G..."
                    value={receiver.stellarAddress || ""}
                    onChange={(e) => handleStellarAddressChange(e.target.value)}
                    className="font-mono text-sm"
                  />
                  {addressError && <p className="text-xs text-destructive">{addressError}</p>}
                  <p className="text-[10px] text-muted-foreground">Must start with G, exactly 56 characters</p>
                </div>
              </div>
            )}

            {/* Bank Account form */}
            {receiverMethod === "bank" && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs">Account Holder Name</Label>
                  <Input
                    placeholder="Full name"
                    value={receiver.accountHolder || ""}
                    onChange={(e) => setReceiver(prev => ({ ...prev, accountHolder: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Bank Name</Label>
                  <Input
                    placeholder="e.g. Dutch Bangla Bank"
                    value={receiver.bankName || ""}
                    onChange={(e) => setReceiver(prev => ({ ...prev, bankName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Account Number</Label>
                  <Input
                    placeholder="Account number"
                    value={receiver.accountNumber || ""}
                    onChange={(e) => setReceiver(prev => ({ ...prev, accountNumber: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Mobile Wallet form */}
            {receiverMethod === "mobile" && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs">Mobile Wallet Provider</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {["bKash", "Nagad", "Rocket"].map(provider => (
                      <button
                        key={provider}
                        onClick={() => setReceiver(prev => ({ ...prev, mobileProvider: provider }))}
                        className={`p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                          receiver.mobileProvider === provider
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        {provider}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Mobile Number</Label>
                  <Input
                    placeholder="+880..."
                    value={receiver.mobileNumber || ""}
                    onChange={(e) => setReceiver(prev => ({ ...prev, mobileNumber: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Send button */}
            {receiverMethod && (
              <Button
                className="w-full h-12 gap-2 mt-2"
                disabled={!isReceiverValid() || parsedSendAmount <= 0 || parsedSendAmount > getAvailableBalance(sendCurrency)}
                onClick={handleSend}
              >
                Send {sendCurrency === "USD" ? "$" : ""}{receiverGets.toFixed(2)} {sendCurrency} <ArrowRight className="w-4 h-4" />
              </Button>
            )}

            {/* Info footer */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-1">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              Instant · Near-zero fees · Secure
            </div>
          </CardContent>
        </Card>
      )}
        </>
      )}
    </div>
  );
};

export default SendMoneyUSDCFlow;
