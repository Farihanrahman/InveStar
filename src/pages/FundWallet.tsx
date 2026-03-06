import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Building2, FileText, Loader2, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";

const FundWallet = () => {
  const { isAuthenticated, token, isLoading: authLoading } = useOmsAuth();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'cancelled') {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const handleCardPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { amount: parseFloat(amount) * 100 },
        headers: token ? {
          Authorization: `Bearer ${token}`,
        } : {},
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to Stripe",
          description: "Opening payment page in a new tab. Complete payment and return here.",
        });
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayPalPayment = () => {
    toast({
      title: "PayPal Integration",
      description: "PayPal payment functionality will be available soon. Please use card payment or contact support.",
    });
  };

  const handleACHTransfer = () => {
    toast({
      title: "ACH Transfer",
      description: "ACH transfer functionality will be available soon. Please contact support for assistance.",
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Add Funds
          </h1>
          <p className="text-muted-foreground mt-2">
            Choose your preferred funding method
          </p>
        </div>

        <Tabs defaultValue="card" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="card">
              <CreditCard className="w-4 h-4 mr-2" />
              Stripe
            </TabsTrigger>
            <TabsTrigger value="paypal">
              <Wallet className="w-4 h-4 mr-2" />
              PayPal
            </TabsTrigger>
            <TabsTrigger value="ach">
              <Building2 className="w-4 h-4 mr-2" />
              Bank Transfer
            </TabsTrigger>
            <TabsTrigger value="wire">
              <FileText className="w-4 h-4 mr-2" />
              Wire
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card">
            <Card>
              <CardHeader>
                <CardTitle>Stripe Payment</CardTitle>
                <CardDescription>
                  Secure payment via Stripe - accepts Visa, Mastercard, and American Express
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card-amount">Amount (USD)</Label>
                  <Input
                    id="card-amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processing Fee (2.9% + $0.30)</span>
                    <span className="font-medium">
                      ${amount ? ((parseFloat(amount) * 0.029) + 0.30).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>
                      ${amount ? (parseFloat(amount) + (parseFloat(amount) * 0.029) + 0.30).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
                <Button 
                  onClick={handleCardPayment} 
                  disabled={isLoading || !amount}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Continue to Payment'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paypal">
            <Card>
              <CardHeader>
                <CardTitle>PayPal</CardTitle>
                <CardDescription>
                  Fast and secure payments through your PayPal account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paypal-amount">Amount (USD)</Label>
                  <Input
                    id="paypal-amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Benefits:</p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Instant funding</li>
                    <li>Buyer protection</li>
                    <li>No need to share card details</li>
                  </ul>
                </div>
                <Button 
                  onClick={handlePayPalPayment}
                  disabled={!amount}
                  className="w-full bg-[#0070ba] hover:bg-[#005ea6]"
                >
                  Continue with PayPal
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ach">
            <Card>
              <CardHeader>
                <CardTitle>ACH Bank Transfer</CardTitle>
                <CardDescription>
                  Free transfers from your US bank account (3-5 business days)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ach-amount">Amount (USD)</Label>
                  <Input
                    id="ach-amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Benefits:</p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>No processing fees</li>
                    <li>Higher transfer limits</li>
                    <li>Secure bank-to-bank transfer</li>
                  </ul>
                </div>
                <Button 
                  onClick={handleACHTransfer}
                  disabled={!amount}
                  className="w-full"
                >
                  Connect Bank Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wire">
            <Card>
              <CardHeader>
                <CardTitle>Wire Transfer</CardTitle>
                <CardDescription>
                  Large deposits via domestic or international wire (1-2 business days)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h3 className="font-semibold">Wire Instructions</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Bank Name:</span>
                      <p className="font-medium">Available after account verification</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Account Number:</span>
                      <p className="font-medium">Contact support for details</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Routing Number:</span>
                      <p className="font-medium">Contact support for details</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">SWIFT Code:</span>
                      <p className="font-medium">For international transfers</p>
                    </div>
                  </div>
                </div>
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                  <p className="text-sm">
                    <span className="font-semibold">Note:</span> Please include your InveStar account ID in the wire reference.
                    Contact support at hello@investarbd.com for complete wire instructions.
                  </p>
                </div>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.href = 'mailto:hello@investarbd.com?subject=Wire Transfer Instructions'}
                >
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
