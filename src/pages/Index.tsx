import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimatedBackground from "@/components/AnimatedBackground";
import MoneyFlowGlobe from "@/components/MoneyFlowGlobe";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Shield, TrendingUp, Wallet, BarChart3, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import AICoachWidget from "@/components/AICoachWidget";
import NewsTicker from "@/components/NewsTicker";
import FxRateCalculator from "@/components/FxRateCalculator";

const Index = () => {
  const features = [
    {
      icon: TrendingUp,
      title: "Real-Time Trading",
      description: "Access live market data and execute trades instantly with our advanced trading platform.",
    },
    {
      icon: Wallet,
      title: "Integrated Wallet",
      description: "Seamlessly connect your wallet and manage all your assets in one secure place.",
    },
    {
      icon: BarChart3,
      title: "Portfolio Analytics",
      description: "Track your investments with detailed analytics and performance metrics.",
    },
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your investments are protected with enterprise-grade security and encryption.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Execute trades in milliseconds with our optimized trading infrastructure.",
    },
    {
      icon: TrendingUp,
      title: "Expert Insights",
      description: "Get market insights and analysis to make informed investment decisions.",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AnimatedBackground />
      <Navigation />
      
      {/* Hero Section with Globe */}
      <section className="relative min-h-[80vh] pt-24 pb-20 overflow-hidden">
        {/* Globe Animation Background */}
        <div className="absolute inset-0 z-0">
          <MoneyFlowGlobe />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent z-[1]" />
        
        <div className="container mx-auto px-4 relative z-10 h-full flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
              InveStar: Build Wealth From Every Cross-Border Payment
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-150">
              Global Payments to Smart Investing.
            </p>
            <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
              <Button size="lg" asChild className="gap-2 text-lg px-8 bg-gradient-to-r from-primary/80 to-primary hover:opacity-90 shadow-[0_0_20px_hsl(200_100%_50%/0.4)] hover:shadow-[0_0_30px_hsl(200_100%_50%/0.6)]">
                <Link to="/send-money">
                  Send Money <Wallet className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" asChild className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8">
                <Link to="/investor-quiz">
                  Start Investing <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="gap-2 text-lg px-8 border-primary/50 hover:bg-primary/10">
                <Link to="/demo">
                  Try Demo <Zap className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabs - Investments & Payments */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Remit Tab */}
            <Card className="web3-card web3-card-accent cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="web3-icon p-3 rounded-full bg-accent/20 group-hover:bg-accent/30 transition-colors duration-300">
                    <Wallet className="w-6 h-6 text-accent group-hover:drop-shadow-[0_0_8px_hsl(142_76%_45%)] transition-all duration-300" />
                  </div>
                  <span className="group-hover:text-accent transition-colors duration-300">Remit</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <FxRateCalculator />
                <Link to="/send-money">
                  <Button variant="outline" className="web3-btn w-full justify-start gap-3 h-12 border-accent/20 hover:border-accent/50 hover:bg-accent/10">
                    <ArrowRight className="w-5 h-5" />
                    Send Money
                  </Button>
                </Link>
                <Link to="/wallet">
                  <Button className="web3-btn w-full justify-start gap-3 h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 hover:shadow-[0_0_20px_hsl(142_76%_45%/0.4)]">
                    <Wallet className="w-5 h-5" />
                    My Wallet
                  </Button>
                </Link>
                <Link to="/fund-wallet">
                  <Button variant="outline" className="web3-btn w-full justify-start gap-3 h-12 border-accent/20 hover:border-accent/50 hover:bg-accent/10">
                    <Shield className="w-5 h-5" />
                    Fund Wallet
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Investments Tab */}
            <Card className="web3-card web3-card-primary cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="web3-icon p-3 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors duration-300">
                    <TrendingUp className="w-6 h-6 text-primary group-hover:drop-shadow-[0_0_8px_hsl(200_100%_50%)] transition-all duration-300" />
                  </div>
                  <span className="group-hover:text-primary transition-colors duration-300">Investments</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/portfolio">
                  <Button variant="outline" className="web3-btn w-full justify-start gap-3 h-12 border-primary/20 hover:border-primary/50 hover:bg-primary/10">
                    <BarChart3 className="w-5 h-5" />
                    Portfolio
                  </Button>
                </Link>
                <Link to="/virtual-trading">
                  <Button variant="outline" className="web3-btn w-full justify-start gap-3 h-12 border-primary/20 hover:border-primary/50 hover:bg-primary/10">
                    <TrendingUp className="w-5 h-5" />
                    Virtual Trading
                  </Button>
                </Link>
                <Link to="/net-worth">
                  <Button variant="outline" className="web3-btn w-full justify-start gap-3 h-12 border-primary/20 hover:border-primary/50 hover:bg-primary/10">
                    <BarChart3 className="w-5 h-5" />
                    Net Worth
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="outline" className="web3-btn w-full justify-start gap-3 h-12 border-primary/20 hover:border-primary/50 hover:bg-primary/10">
                    <TrendingUp className="w-5 h-5" />
                    Markets
                  </Button>
                </Link>
                <Link to="/ai-coach">
                  <Button variant="outline" className="web3-btn w-full justify-start gap-3 h-12 border-primary/20 hover:border-primary/50 hover:bg-primary/10">
                    <Zap className="w-5 h-5" />
                    AI Coach
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* News Ticker */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-semibold text-foreground">Latest News</h2>
          </div>
          <NewsTicker />
        </div>
      </section>

      {/* AI Coach Widget */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <AICoachWidget />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Powerful AI-driven features designed for modern investors
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-primary to-accent text-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Start Investing?
              </h2>
              <p className="text-lg mb-8 opacity-90">
                Join thousands of investors already using InveStar
              </p>
              <Button size="lg" variant="secondary" asChild className="gap-2 text-lg px-8">
                <Link to="/investor-quiz">
                  Get Started Now <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
