import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, ArrowLeft, Wallet, TrendingUp, BarChart3, 
  Globe, Sparkles, Shield, Zap, Play, CheckCircle2, Eye, Bot, Send, RefreshCw, Search, MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";
import FxRateCalculator from "@/components/FxRateCalculator";
import RemittanceInvestPrompt from "@/components/RemittanceInvestPrompt";
import ComplianceCheckCard from "@/components/ComplianceCheckCard";
import FeeComparison from "@/components/FeeComparison";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

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
    title: "InveStar Agent",
    subtitle: "Autonomous AI Coach",
    description: "Meet your AI-powered financial coach. Just type \"Buy 100 shares of Apple\" or \"Send $200 to Ahmed via bKash\" — the agent executes trades and payments instantly, with real-time web search for live market data.",
    icon: Bot,
    color: "from-violet-600 to-indigo-500",
    features: [
      "Natural language trade execution",
      "\"Send $100 to Ahmed\" — instant payments",
      "Live market data via web search",
      "CFA-level portfolio analysis",
      "Personalized risk & allocation settings",
    ],
    cta: { label: "Try InveStar Agent", link: "/clawbot" },
  },
  {
    id: 2,
    title: "Send Money Globally",
    subtitle: "Cross-Border Payments Made Simple",
    description: "Send money to family and friends worldwide via Bank Transfer, PayPal, USDC on Stellar, or MoneyGram cash pickup. Real-time FX rates and low fees.",
    icon: Globe,
    color: "from-blue-500 to-cyan-500",
    features: ["Real-time FX calculator", "Multiple payment methods", "Auto-invest from remittance", "Recurring transfers"],
    cta: { label: "Try Send Money", link: "/send-money" },
  },
  {
    id: 3,
    title: "Invest While You Remit",
    subtitle: "Build Wealth From Every Transfer",
    description: "Automatically invest 1%, 5%, or 10% of every remittance into a diversified portfolio. Set it once and watch your wealth grow with every payment.",
    icon: Sparkles,
    color: "from-accent to-emerald-500",
    features: ["Auto-invest on remittance", "1%, 5%, 10% or custom", "Recurring investment option", "Portfolio tracking"],
    cta: { label: "Send & Invest", link: "/send-money" },
  },
  {
    id: 4,
    title: "Smart Portfolio",
    subtitle: "AI-Powered Investment Management",
    description: "Track your real and virtual portfolios with real-time market data. Get AI-driven insights and trade US & Bangladesh stocks.",
    icon: TrendingUp,
    color: "from-primary to-blue-500",
    features: ["Live market data", "Virtual trading simulator", "Price alerts", "OMS integration"],
    cta: { label: "View Portfolio", link: "/portfolio" },
  },
  {
    id: 5,
    title: "Stellar Wallet",
    subtitle: "USDC & Digital Assets",
    description: "Fund your wallet, hold USDC on Stellar, swap assets on the DEX, and transfer to anyone globally in seconds with near-zero fees.",
    icon: Wallet,
    color: "from-green-500 to-emerald-500",
    features: ["USDC on Stellar", "DEX trading", "Fiat on/off ramp", "Instant transfers"],
    cta: { label: "Open Wallet", link: "/wallet" },
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
  const { t } = useI18n();
  const step = demoSteps[currentStep];
  const Icon = step.icon;

  const showFxCalculator = step.id === 2 || step.id === 3;
  const showInvestPrompt = step.id === 3;
  const showComplianceCheck = step.id === 2;
  const showFeeComparison = step.id === 2;
  const showSimulatedPortfolio = step.id === 4;
  const showAgentDemo = step.id === 1;

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

                {/* Agent Demo Preview */}
                {showAgentDemo && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-3">
                    {/* Simulated chat */}
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold">Agent Chat Preview</span>
                          <Badge variant="secondary" className="text-[10px]">Live Demo</Badge>
                        </div>

                        {/* User message */}
                        <div className="flex justify-end">
                          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-2xl rounded-br-md text-sm max-w-[80%]">
                            Buy 100 shares of Apple
                          </div>
                        </div>

                        {/* Agent searching */}
                        <div className="flex justify-start">
                          <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md text-sm max-w-[80%] space-y-2">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Search className="w-3 h-3 animate-pulse" />
                              Searching: "AAPL current stock price"
                            </div>
                            <p className="text-foreground">AAPL is trading at <strong>$198.50</strong>. Placing a market buy order for <strong>$19,850</strong> (100 shares × $198.50).</p>
                          </div>
                        </div>

                        {/* Action card */}
                        <div className="rounded-lg border border-green-500/30 bg-green-50 dark:bg-green-950/20 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trade Executed</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">DEMO</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <span className="font-semibold">BUY</span>
                            <span className="text-primary font-bold">AAPL</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span>$19,850</span>
                          </div>
                        </div>

                        {/* Second example — Send money */}
                        <div className="flex justify-end">
                          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-2xl rounded-br-md text-sm max-w-[80%]">
                            Send $200 to Ahmed via bKash
                          </div>
                        </div>

                        <div className="rounded-lg border border-green-500/30 bg-green-50 dark:bg-green-950/20 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Initiated</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Send className="w-4 h-4 text-primary" />
                            <span className="font-semibold">$200</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span className="text-primary font-bold">Ahmed</span>
                            <Badge variant="secondary" className="text-[10px]">bKash</Badge>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Rate: 1 USD = ৳122.78 • Receiver gets: ৳24,556
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Capability badges */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        { icon: MessageSquare, label: "Natural Language" },
                        { icon: Search, label: "Web Search" },
                        { icon: TrendingUp, label: "Trade Execution" },
                        { icon: Send, label: "Payments" },
                        { icon: RefreshCw, label: "Recurring DCA" },
                        { icon: Shield, label: "Risk Guardrails" },
                      ].map(({ icon: I, label }) => (
                        <Badge key={label} variant="outline" className="gap-1 py-1">
                          <I className="w-3 h-3" /> {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interactive FX Calculator for remittance steps */}
                {showFxCalculator && (
                  <div className="animate-in fade-in duration-500">
                    <FxRateCalculator onAmountChange={setDemoAmount} initialAmount={demoAmount} />
                  </div>
                )}

                {/* Fee Comparison */}
                {showFeeComparison && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <FeeComparison amount={parseFloat(demoAmount) || 100} currency="BDT" />
                  </div>
                )}

                {/* Compliance Check */}
                {showComplianceCheck && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                    <ComplianceCheckCard action="send_abroad" userType="nrb" amount={parseFloat(demoAmount) || 100} />
                  </div>
                )}

                {/* Interactive Invest Prompt */}
                {showInvestPrompt && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <RemittanceInvestPrompt
                      amount={demoAmount}
                      onSkip={() => {
                        toast({ title: "Skipped", description: "You can always enable auto-invest later." });
                        setCurrentStep(3);
                      }}
                      onInvest={(pct, recurring) => {
                        toast({
                          title: "Investment Set! 🎉",
                          description: `${pct}% of $${demoAmount} = $${(parseFloat(demoAmount || "0") * pct / 100).toFixed(2)} will be invested${recurring ? " on every transfer" : ""}.`,
                        });
                        setCurrentStep(3);
                      }}
                    />
                  </div>
                )}

                {/* Simulated Portfolio Preview */}
                {showSimulatedPortfolio && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Eye className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold">Sample Portfolio Preview</span>
                          <Badge variant="secondary" className="text-[10px]">Demo Data</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {[
                            { symbol: "AAPL", name: "Apple", price: "$198.50", change: "+1.2%" },
                            { symbol: "GP", name: "Grameenphone", price: "৳425", change: "+0.8%" },
                            { symbol: "BTC", name: "Bitcoin", price: "$97,500", change: "+2.1%" },
                            { symbol: "BRACBANK", name: "BRAC Bank", price: "৳42.50", change: "+1.8%" },
                          ].map((stock) => (
                            <div key={stock.symbol} className="flex items-center justify-between p-2 rounded-md bg-background/50 border border-border/50">
                              <div>
                                <span className="font-semibold">{stock.symbol}</span>
                                <span className="text-xs text-muted-foreground ml-1">{stock.name}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-xs">{stock.price}</div>
                                <div className="text-xs text-green-500">{stock.change}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 text-center">
                          Sign up to track your real portfolio with live prices
                        </p>
                      </CardContent>
                    </Card>
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
