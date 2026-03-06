import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, ArrowLeft, Wallet, TrendingUp, BarChart3, 
  Globe, Sparkles, Shield, Zap, Play, CheckCircle2 
} from "lucide-react";
import { Link } from "react-router-dom";
import FxRateCalculator from "@/components/FxRateCalculator";
import RemittanceInvestPrompt from "@/components/RemittanceInvestPrompt";
import { useToast } from "@/hooks/use-toast";

interface DemoStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  color: string;
  features: string[];
  cta: { label: string; link: string };
}

const demoSteps: DemoStep[] = [
  {
    id: 1,
    title: "Send Money Globally",
    subtitle: "Cross-Border Payments Made Simple",
    description: "Send money to family and friends worldwide via Bank Transfer, PayPal, USDC on Stellar, or MoneyGram cash pickup. Real-time FX rates and low fees.",
    icon: Globe,
    color: "from-blue-500 to-cyan-500",
    features: ["Real-time FX calculator", "Multiple payment methods", "Auto-invest from remittance", "Recurring transfers"],
    cta: { label: "Try Send Money", link: "/send-money" },
  },
  {
    id: 2,
    title: "Invest While You Remit",
    subtitle: "Build Wealth From Every Transfer",
    description: "Automatically invest 1%, 5%, or 10% of every remittance into a diversified portfolio. Set it once and watch your wealth grow with every payment.",
    icon: Sparkles,
    color: "from-accent to-emerald-500",
    features: ["Auto-invest on remittance", "1%, 5%, 10% or custom", "Recurring investment option", "Portfolio tracking"],
    cta: { label: "Send & Invest", link: "/send-money" },
  },
  {
    id: 3,
    title: "Smart Portfolio",
    subtitle: "AI-Powered Investment Management",
    description: "Track your real and virtual portfolios with real-time market data. Get AI-driven insights and trade US & Bangladesh stocks.",
    icon: TrendingUp,
    color: "from-primary to-blue-500",
    features: ["Live market data", "Virtual trading simulator", "Price alerts", "OMS integration"],
    cta: { label: "View Portfolio", link: "/portfolio" },
  },
  {
    id: 4,
    title: "Stellar Wallet",
    subtitle: "USDC & Digital Assets",
    description: "Fund your wallet, hold USDC on Stellar, swap assets on the DEX, and transfer to anyone globally in seconds with near-zero fees.",
    icon: Wallet,
    color: "from-green-500 to-emerald-500",
    features: ["USDC on Stellar", "DEX trading", "Fiat on/off ramp", "Instant transfers"],
    cta: { label: "Open Wallet", link: "/wallet" },
  },
  {
    id: 5,
    title: "AI Financial Coach",
    subtitle: "Your Personal Investment Advisor",
    description: "Chat with InveStar AI for personalized financial advice, market analysis, and investment strategies tailored to your goals.",
    icon: Zap,
    color: "from-purple-500 to-pink-500",
    features: ["Personalized advice", "Market analysis", "Voice chat support", "Investment strategies"],
    cta: { label: "Talk to AI Coach", link: "/ai-coach" },
  },
  {
    id: 6,
    title: "Track Net Worth",
    subtitle: "Complete Financial Picture",
    description: "Import assets, track liabilities, and see your complete financial picture with beautiful charts and analytics.",
    icon: BarChart3,
    color: "from-orange-500 to-amber-500",
    features: ["Asset tracking", "Excel import", "Pie chart breakdown", "Goal setting"],
    cta: { label: "Track Net Worth", link: "/net-worth" },
  },
];

const Demo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [demoAmount, setDemoAmount] = useState("100");
  const { toast } = useToast();
  const step = demoSteps[currentStep];
  const Icon = step.icon;

  // Show interactive widgets for steps 1 & 2
  const showFxCalculator = step.id === 1 || step.id === 2;
  const showInvestPrompt = step.id === 2;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-3 gap-1">
              <Play className="w-3 h-3" /> Interactive Demo
            </Badge>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Discover InveStar
            </h1>
            <p className="text-muted-foreground mt-2">
              Explore all features — click through to try them live
            </p>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-1.5 mb-8">
            {demoSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? "bg-gradient-to-r from-primary to-accent"
                    : i < currentStep
                    ? "bg-primary/40"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Step Counter */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground font-medium">
              Step {currentStep + 1} of {demoSteps.length}
            </span>
            <Badge variant="outline">{step.subtitle}</Badge>
          </div>

          {/* Main Card */}
          <Card className="overflow-hidden border-2 border-primary/10 animate-in fade-in slide-in-from-right-4 duration-500" key={step.id}>
            <CardContent className="p-0">
              {/* Hero Section */}
              <div className={`bg-gradient-to-br ${step.color} p-8 md:p-12 text-white`}>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">{step.title}</h2>
                    <p className="text-white/90 text-base md:text-lg leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="p-6 md:p-8 space-y-6">
                {/* Interactive FX Calculator for remittance steps */}
                {showFxCalculator && (
                  <div className="animate-in fade-in duration-500">
                    <FxRateCalculator onAmountChange={setDemoAmount} initialAmount={demoAmount} />
                  </div>
                )}

                {/* Interactive Invest Prompt for step 2 */}
                {showInvestPrompt && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <RemittanceInvestPrompt
                      amount={demoAmount}
                      onSkip={() => {
                        toast({ title: "Skipped", description: "You can always enable auto-invest later." });
                        setCurrentStep(2);
                      }}
                      onInvest={(pct, recurring) => {
                        toast({
                          title: "Investment Set! 🎉",
                          description: `${pct}% of $${demoAmount} = $${(parseFloat(demoAmount || "0") * pct / 100).toFixed(2)} will be invested${recurring ? " on every transfer" : ""}.`,
                        });
                        setCurrentStep(2);
                      }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {step.features.map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50 border border-border/50 animate-in fade-in duration-300"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                      <span className="text-sm font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild className="flex-1 h-12 gap-2 text-base bg-gradient-to-r from-primary to-accent hover:opacity-90">
                    <Link to={step.cta.link}>
                      {step.cta.label} <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </Button>
            {currentStep < demoSteps.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="gap-2 bg-gradient-to-r from-primary to-accent"
              >
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button asChild className="gap-2 bg-gradient-to-r from-accent to-primary">
                <Link to="/send-money">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Demo;
