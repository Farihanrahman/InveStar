import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Wallet, 
  ArrowRight, 
  Globe, 
  CreditCard,
  CheckCircle,
  ChevronRight
} from "lucide-react";
import FxRateCalculator from "@/components/FxRateCalculator";
import RemittanceInvestPrompt from "@/components/RemittanceInvestPrompt";
import SendMoneyUSDCFlow from "@/components/SendMoneyUSDCFlow";
import ComplianceCheckCard from "@/components/ComplianceCheckCard";
import FeeComparison from "@/components/FeeComparison";

type PaymentMethod = "bank" | "paypal" | "usdc" | "moneygram" | null;

const methodLabels: Record<string, string> = {
  bank: "Bank Transfer",
  paypal: "PayPal Transfer",
  usdc: "InveStar Wallet (USDC)",
  moneygram: "MoneyGram",
};

const SendMoney = () => {
  const { isAuthenticated, isLoading } = useOmsAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [amount, setAmount] = useState("100");
  const [recipient, setRecipient] = useState("");
  const [showInvestPrompt, setShowInvestPrompt] = useState(false);
  const [investmentConfirmed, setInvestmentConfirmed] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading || (!isLoading && !isAuthenticated)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const paymentMethods = [
    { id: "usdc" as PaymentMethod, name: "InveStar Wallet (USDC)", description: "Send USDC instantly via Stellar network", icon: Wallet, color: "from-green-500 to-green-600", available: true },
    { id: "bank" as PaymentMethod, name: "Bank Transfer", description: "Send directly to a bank account", icon: Building2, color: "from-blue-500 to-blue-600", available: true },
    { id: "paypal" as PaymentMethod, name: "PayPal", description: "Send via PayPal instantly", icon: CreditCard, color: "from-indigo-500 to-indigo-600", available: true },
    { id: "moneygram" as PaymentMethod, name: "MoneyGram", description: "Cash pickup worldwide", icon: Globe, color: "from-orange-500 to-orange-600", available: true },
  ];

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setShowInvestPrompt(true);
    setInvestmentConfirmed(false);
  };

  const handleProceedAfterPrompt = () => {
    if (selectedMethod === "usdc") {
      // Stay on page - show inline USDC flow
    } else if (selectedMethod === "moneygram") {
      navigate("/moneygram-ramps");
    }
  };

  const handleInvestSkip = () => {
    setShowInvestPrompt(false);
    setInvestmentConfirmed(true);
    handleProceedAfterPrompt();
  };

  const handleInvest = (percentage: number, recurring: boolean) => {
    const parsedAmount = parseFloat(amount) || 0;
    const investAmt = parsedAmount * percentage / 100;
    setInvestmentAmount(investAmt);
    // Persist to localStorage so Portfolio page can read it
    const existing = parseFloat(localStorage.getItem("remit_invest_balance") || "0");
    localStorage.setItem("remit_invest_balance", (existing + investAmt).toFixed(2));
    setShowInvestPrompt(false);
    setInvestmentConfirmed(true);
    toast({
      title: "Investment Set! 🎉",
      description: `${percentage}% ($${investAmt.toFixed(2)}) of your remittance will be invested${recurring ? " on every transfer" : ""}. Check your Portfolio!`,
    });
    handleProceedAfterPrompt();
  };

  const handleContinue = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount to send.", variant: "destructive" });
      return;
    }
    if (!recipient) {
      toast({ title: "Recipient Required", description: "Please enter recipient details.", variant: "destructive" });
      return;
    }
    toast({
      title: "Coming Soon",
      description: `${methodLabels[selectedMethod || "bank"]} integration will be available soon.`,
    });
  };

  const showDetailForm = investmentConfirmed && (selectedMethod === "bank" || selectedMethod === "paypal");
  const showUSDCFlow = investmentConfirmed && selectedMethod === "usdc";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Send Money
            </h1>
            <p className="text-muted-foreground mt-2">Choose how you want to send money</p>
          </div>

          <div className="mb-6">
            <FxRateCalculator onAmountChange={(val) => setAmount(val)} initialAmount={amount} />
          </div>

          {/* Fee Comparison */}
          {!selectedMethod && parseFloat(amount) > 0 && (
            <div className="mb-6 animate-in fade-in duration-500">
              <FeeComparison amount={parseFloat(amount) || 100} currency="BDT" />
            </div>
          )}

          {/* Compliance Check */}
          {!selectedMethod && (
            <div className="mb-6 animate-in fade-in duration-500 delay-150">
              <ComplianceCheckCard action="send_abroad" userType="nrb" amount={parseFloat(amount) || 100} />
            </div>
          )}

          {/* Investment Prompt */}
          {showInvestPrompt && selectedMethod && (
            <div className="mb-6">
              <RemittanceInvestPrompt
                amount={amount || "100"}
                onSkip={handleInvestSkip}
                onInvest={handleInvest}
              />
            </div>
          )}

          {/* USDC inline flow */}
          {showUSDCFlow && (
            <SendMoneyUSDCFlow
              amount={amount}
              investmentAmount={investmentAmount}
              onBack={() => { setSelectedMethod(null); setShowInvestPrompt(false); setInvestmentConfirmed(false); setInvestmentAmount(0); }}
            />
          )}

          {/* Payment method selection */}
          {!showDetailForm && !showUSDCFlow && !showInvestPrompt && !selectedMethod ? (
            <div className="grid gap-4">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <Card
                    key={method.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-2 border-transparent hover:border-primary/50`}
                    onClick={() => handleMethodSelect(method.id)}
                  >
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{method.name}</h3>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : !showDetailForm && !showUSDCFlow && !showInvestPrompt ? (
            <div className="grid gap-4">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <Card
                    key={method.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-2 border-transparent hover:border-primary/50`}
                    onClick={() => handleMethodSelect(method.id)}
                  >
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{method.name}</h3>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : null}

          {/* Detail form - only for bank/paypal */}
          {showDetailForm && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedMethod(null); setShowInvestPrompt(false); setInvestmentConfirmed(false); }}>
                    ← Back
                  </Button>
                  <div>
                    <CardTitle>{methodLabels[selectedMethod || "bank"]}</CardTitle>
                    <CardDescription>Enter transfer details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (USD)</Label>
                  <Input id="amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-2xl h-14" />
                </div>
                {selectedMethod === "bank" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="accountName">Account Holder Name</Label>
                      <Input id="accountName" placeholder="Enter account holder name" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input id="accountNumber" placeholder="Enter account number" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="routingNumber">Routing Number</Label>
                      <Input id="routingNumber" placeholder="Enter routing number" />
                    </div>
                  </>
                )}
                {selectedMethod === "paypal" && (
                  <div className="space-y-2">
                    <Label htmlFor="paypalEmail">PayPal Email</Label>
                    <Input id="paypalEmail" type="email" placeholder="recipient@email.com" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
                  </div>
                )}
                <Button className="w-full h-12 gap-2 bg-gradient-to-r from-primary to-accent" onClick={handleContinue}>
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Secure & encrypted transfer
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendMoney;
