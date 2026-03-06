import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const MoneyGramRamps = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    walletName: "",
    walletDomain: "",
    authAddress: "",
    sourceAddress: "",
    depositAddress: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Application Submitted",
      description: "Your MoneyGram Ramps access request has been submitted. We'll contact you at the provided email.",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-32">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              MoneyGram Ramps Integration
            </h1>
            <p className="text-xl text-muted-foreground">
              Cash in and cash out crypto at MoneyGram locations worldwide
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Powered by the Stellar blockchain
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                About MoneyGram Ramps
                <a 
                  href="https://developer.moneygram.com/moneygram-developer/docs/access-to-moneygram-ramps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                MoneyGram Ramps allows your users to convert cash to crypto (on-ramp) 
                and crypto to cash (off-ramp) at thousands of MoneyGram agent locations globally.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold mb-2">Sandbox (Testnet)</h3>
                  <p className="text-sm text-muted-foreground">
                    Test environment with simulated funds. Requires coordination 
                    with MoneyGram onboarding team.
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold mb-2">Preview (Mainnet)</h3>
                  <p className="text-sm text-muted-foreground">
                    Production environment with real funds. Requires visiting 
                    physical MoneyGram locations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Access</CardTitle>
              <p className="text-sm text-muted-foreground">
                Provide your wallet details to get allowlisted for MoneyGram Ramps
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact email for this wallet
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="walletName">Wallet Name *</Label>
                  <Input
                    id="walletName"
                    name="walletName"
                    required
                    value={formData.walletName}
                    onChange={handleChange}
                    placeholder="My Stellar Wallet"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="walletDomain">Wallet Domain with TOML file *</Label>
                  <Input
                    id="walletDomain"
                    name="walletDomain"
                    required
                    value={formData.walletDomain}
                    onChange={handleChange}
                    placeholder="example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter only the domain name (e.g., example.com). Remove "https://"
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authAddress">Authentication Address (SEP-10) *</Label>
                  <Input
                    id="authAddress"
                    name="authAddress"
                    required
                    value={formData.authAddress}
                    onChange={handleChange}
                    placeholder="G..."
                  />
                  <p className="text-xs text-muted-foreground">
                    A Stellar account for authentication (e.g., G...)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sourceAddress">Source Address *</Label>
                  <Input
                    id="sourceAddress"
                    name="sourceAddress"
                    required
                    value={formData.sourceAddress}
                    onChange={handleChange}
                    placeholder="G..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Account funds are withdrawn from (e.g., G...)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depositAddress">Deposit Address *</Label>
                  <Input
                    id="depositAddress"
                    name="depositAddress"
                    required
                    value={formData.depositAddress}
                    onChange={handleChange}
                    placeholder="G..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Funds will be deposited here (e.g., G...)
                  </p>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                  By submitting, you agree to{" "}
                  <a 
                    href="https://www.moneygram.com/intl/privacy-notice"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    MoneyGram's Privacy Policy
                  </a>
                  {" "}and{" "}
                  <a 
                    href="https://corporate.moneygram.com/terms-of-use/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Terms of Use
                  </a>
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Submit Application
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MoneyGramRamps;
