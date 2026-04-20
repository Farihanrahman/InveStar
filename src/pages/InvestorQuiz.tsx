import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle, Star, Shield, Rocket, TrendingUp, Zap, Loader2, BarChart3, Coins, PieChart, Landmark, Calendar, Clock, RefreshCw, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InvestorArchetypeCard from "@/components/InvestorArchetypeCard";

interface InvestmentRecommendation {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  allocation: string;
  examples: string[];
  riskLevel: "Low" | "Medium" | "High" | "Very High";
  color: string;
}
interface Question {
  id: string;
  question: string;
  options: { value: string; label: string; description?: string; icon?: string }[];
}

const questions: Question[] = [
  {
    id: "goal",
    question: "What brings you to investing?",
    options: [
      { value: "retirement", label: "🏖️ Retirement Planning", description: "Building a secure future for my golden years" },
      { value: "wealth", label: "📈 Grow My Wealth", description: "Long-term financial growth and independence" },
      { value: "income", label: "💰 Generate Passive Income", description: "Regular returns through dividends and interest" },
      { value: "short-term", label: "⚡ Quick Returns", description: "Active trading for short-term gains" },
    ],
  },
  {
    id: "risk",
    question: "How do you feel when markets drop 20%?",
    options: [
      { value: "conservative", label: "😰 I'd lose sleep", description: "I prefer stability, even if returns are lower" },
      { value: "moderate", label: "🤔 Concerned, but I'd hold", description: "I can handle some volatility for better returns" },
      { value: "aggressive", label: "💪 Time to buy more!", description: "I see dips as opportunities" },
      { value: "very-aggressive", label: "🚀 All in!", description: "Maximum risk for maximum potential gains" },
    ],
  },
  {
    id: "timeline",
    question: "When do you plan to use this money?",
    options: [
      { value: "short", label: "📅 Within 2 years", description: "Short-term goals like a purchase or emergency fund" },
      { value: "medium", label: "🗓️ 2-5 years", description: "Medium-term planning like buying a home" },
      { value: "long", label: "📆 5-10 years", description: "Long-term goals like kids' education" },
      { value: "very-long", label: "🎯 10+ years", description: "Very long-term wealth building" },
    ],
  },
  {
    id: "amount",
    question: "How much are you starting with?",
    options: [
      { value: "small", label: "🌱 Under $1,000", description: "Starting my investment journey" },
      { value: "medium", label: "🌿 $1,000 - $10,000", description: "Building a solid foundation" },
      { value: "large", label: "🌳 $10,000 - $50,000", description: "Ready to diversify seriously" },
      { value: "very-large", label: "🏔️ Over $50,000", description: "Building a substantial portfolio" },
    ],
  },
  {
    id: "experience",
    question: "What's your investing experience?",
    options: [
      { value: "beginner", label: "🐣 Total Newbie", description: "I'm just getting started" },
      { value: "intermediate", label: "🐥 Some Experience", description: "I've made a few trades before" },
      { value: "advanced", label: "🦅 Experienced", description: "I understand markets well" },
      { value: "expert", label: "🦉 Expert", description: "Professional-level knowledge" },
    ],
  },
  {
    id: "preference",
    question: "What interests you most?",
    options: [
      { value: "stocks", label: "🏢 Stocks & ETFs", description: "Traditional equity investments" },
      { value: "crypto", label: "₿ Cryptocurrency", description: "Digital assets and blockchain" },
      { value: "mixed", label: "🎨 A mix of both", description: "Diversified across asset classes" },
      { value: "passive", label: "🤖 Let AI decide", description: "Automated portfolio management" },
    ],
  },
];

interface InvestorProfile {
  type: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  recommendations: string[];
  investmentSuggestions: InvestmentRecommendation[];
}

// Investment suggestions by risk profile
const getInvestmentSuggestions = (type: string): InvestmentRecommendation[] => {
  const allSuggestions: Record<string, InvestmentRecommendation[]> = {
    guardian: [
      {
        id: "bonds",
        name: "Bonds & Fixed Income",
        description: "Stable returns with minimal volatility",
        icon: <Landmark className="w-8 h-8" />,
        allocation: "50-60%",
        examples: ["Government Bonds", "Treasury Bills", "Corporate Bonds"],
        riskLevel: "Low",
        color: "from-blue-500 to-blue-600",
      },
      {
        id: "etfs",
        name: "Index ETFs",
        description: "Diversified, low-cost market exposure",
        icon: <PieChart className="w-8 h-8" />,
        allocation: "30-40%",
        examples: ["S&P 500 ETF (SPY)", "Total Market ETF (VTI)", "Bond ETF (BND)"],
        riskLevel: "Low",
        color: "from-cyan-500 to-cyan-600",
      },
      {
        id: "dividend-stocks",
        name: "Dividend Stocks",
        description: "Steady income from established companies",
        icon: <BarChart3 className="w-8 h-8" />,
        allocation: "10-20%",
        examples: ["Johnson & Johnson", "Procter & Gamble", "Coca-Cola"],
        riskLevel: "Medium",
        color: "from-green-500 to-green-600",
      },
    ],
    balanced: [
      {
        id: "stocks",
        name: "Growth & Value Stocks",
        description: "Mix of established and growing companies",
        icon: <BarChart3 className="w-8 h-8" />,
        allocation: "40-50%",
        examples: ["Apple (AAPL)", "Microsoft (MSFT)", "Berkshire Hathaway"],
        riskLevel: "Medium",
        color: "from-emerald-500 to-emerald-600",
      },
      {
        id: "etfs",
        name: "Sector ETFs",
        description: "Targeted exposure to specific industries",
        icon: <PieChart className="w-8 h-8" />,
        allocation: "25-35%",
        examples: ["Tech ETF (QQQ)", "Healthcare ETF (XLV)", "Dividend ETF (VYM)"],
        riskLevel: "Medium",
        color: "from-teal-500 to-teal-600",
      },
      {
        id: "crypto",
        name: "Cryptocurrency",
        description: "Small allocation to digital assets",
        icon: <Coins className="w-8 h-8" />,
        allocation: "5-10%",
        examples: ["Bitcoin (BTC)", "Ethereum (ETH)"],
        riskLevel: "High",
        color: "from-yellow-500 to-orange-500",
      },
      {
        id: "bonds",
        name: "Bonds",
        description: "Stability and income generation",
        icon: <Landmark className="w-8 h-8" />,
        allocation: "15-25%",
        examples: ["Corporate Bonds", "Municipal Bonds"],
        riskLevel: "Low",
        color: "from-blue-500 to-blue-600",
      },
    ],
    growth: [
      {
        id: "growth-stocks",
        name: "Growth Stocks",
        description: "High-growth tech and innovative companies",
        icon: <BarChart3 className="w-8 h-8" />,
        allocation: "45-55%",
        examples: ["NVIDIA (NVDA)", "Tesla (TSLA)", "Amazon (AMZN)"],
        riskLevel: "High",
        color: "from-orange-500 to-orange-600",
      },
      {
        id: "crypto",
        name: "Cryptocurrency",
        description: "Digital assets for high growth potential",
        icon: <Coins className="w-8 h-8" />,
        allocation: "15-25%",
        examples: ["Bitcoin (BTC)", "Ethereum (ETH)", "Solana (SOL)"],
        riskLevel: "Very High",
        color: "from-amber-500 to-yellow-500",
      },
      {
        id: "etfs",
        name: "Thematic ETFs",
        description: "Emerging trends and sectors",
        icon: <PieChart className="w-8 h-8" />,
        allocation: "20-30%",
        examples: ["ARK Innovation (ARKK)", "Clean Energy ETF", "AI & Robotics ETF"],
        riskLevel: "High",
        color: "from-red-500 to-orange-500",
      },
    ],
    maverick: [
      {
        id: "crypto",
        name: "Cryptocurrency",
        description: "Aggressive allocation to digital assets",
        icon: <Coins className="w-8 h-8" />,
        allocation: "30-40%",
        examples: ["Bitcoin (BTC)", "Ethereum (ETH)", "Solana (SOL)", "Altcoins"],
        riskLevel: "Very High",
        color: "from-purple-500 to-pink-500",
      },
      {
        id: "growth-stocks",
        name: "High-Growth Stocks",
        description: "Aggressive growth and momentum plays",
        icon: <BarChart3 className="w-8 h-8" />,
        allocation: "35-45%",
        examples: ["NVIDIA (NVDA)", "Tesla (TSLA)", "Small-cap growth stocks"],
        riskLevel: "Very High",
        color: "from-pink-500 to-rose-500",
      },
      {
        id: "etfs",
        name: "Leveraged & Thematic ETFs",
        description: "Amplified exposure to trends",
        icon: <PieChart className="w-8 h-8" />,
        allocation: "15-25%",
        examples: ["3x Tech ETF (TQQQ)", "Biotech ETF", "Emerging Markets"],
        riskLevel: "Very High",
        color: "from-violet-500 to-purple-500",
      },
    ],
  };
  return allSuggestions[type] || allSuggestions.balanced;
};

const determineInvestorType = (answers: Record<string, string>): InvestorProfile => {
  const riskScore =
    {
      conservative: 1,
      moderate: 2,
      aggressive: 3,
      "very-aggressive": 4,
    }[answers.risk] || 2;

  const timelineScore =
    {
      short: 1,
      medium: 2,
      long: 3,
      "very-long": 4,
    }[answers.timeline] || 2;

  const experienceScore =
    {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
      expert: 4,
    }[answers.experience] || 1;

  const overallScore = (riskScore + timelineScore + experienceScore) / 3;

  if (overallScore <= 1.5) {
    return {
      type: "guardian",
      title: "The Guardian",
      description:
        "You value security and steady growth. Your focus is on protecting what you have while building wealth slowly and safely.",
      icon: <Shield className="w-12 h-12 text-blue-400" />,
      color: "from-blue-500 to-cyan-500",
      recommendations: [
        "Focus on bonds and dividend stocks",
        "Consider index funds for stability",
        "Keep an emergency fund of 6+ months",
        "Avoid highly volatile assets",
      ],
      investmentSuggestions: getInvestmentSuggestions("guardian"),
    };
  } else if (overallScore <= 2.5) {
    return {
      type: "balanced",
      title: "The Balanced Achiever",
      description:
        "You take a measured approach, balancing growth potential with risk management. You're patient but not passive.",
      icon: <TrendingUp className="w-12 h-12 text-emerald-400" />,
      color: "from-emerald-500 to-green-500",
      recommendations: [
        "Mix of growth and value stocks",
        "Diversify across sectors",
        "Consider 10-20% in alternatives",
        "Rebalance quarterly",
      ],
      investmentSuggestions: getInvestmentSuggestions("balanced"),
    };
  } else if (overallScore <= 3.5) {
    return {
      type: "growth",
      title: "The Growth Hunter",
      description:
        "You're willing to accept volatility for higher returns. You see market dips as buying opportunities.",
      icon: <Rocket className="w-12 h-12 text-orange-400" />,
      color: "from-orange-500 to-amber-500",
      recommendations: [
        "Focus on growth stocks and tech",
        "Allocate 15-25% to crypto",
        "Consider small-cap opportunities",
        "Use dollar-cost averaging",
      ],
      investmentSuggestions: getInvestmentSuggestions("growth"),
    };
  } else {
    return {
      type: "maverick",
      title: "The Maverick",
      description:
        "You're a risk-taker with experience to back it up. You aim for maximum returns and can handle extreme volatility.",
      icon: <Zap className="w-12 h-12 text-purple-400" />,
      color: "from-purple-500 to-pink-500",
      recommendations: [
        "Aggressive growth strategies",
        "Higher crypto allocation (25%+)",
        "Consider leveraged products carefully",
        "Active trading with strict stop-losses",
      ],
      investmentSuggestions: getInvestmentSuggestions("maverick"),
    };
  }
};

const automationFrequencies = [
  { id: "weekly", label: "Weekly", description: "Invest every week", icon: <Clock className="w-5 h-5" /> },
  { id: "monthly", label: "Monthly", description: "Invest once a month", icon: <Calendar className="w-5 h-5" /> },
  { id: "quarterly", label: "Quarterly", description: "Invest every 3 months", icon: <RefreshCw className="w-5 h-5" /> },
];

const InvestorQuiz = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [existingProfile, setExistingProfile] = useState<InvestorProfile | null>(null);
  const advanceTimeoutRef = useRef<number | null>(null);
  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(null);
  const [automationAmount, setAutomationAmount] = useState<string>("");
  const [showDetails, setShowDetails] = useState(false);

  const checkExistingProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('investor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      const profile = getProfileFromType(data.investor_type);
      setExistingProfile(profile);
      setInvestorProfile(profile);
      setIsComplete(true);
    }
  }, []);

  useEffect(() => {
    void checkExistingProfile();
    return () => {
      if (advanceTimeoutRef.current) {
        window.clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }
    };
  }, [checkExistingProfile]);

  const getProfileFromType = (type: string): InvestorProfile => {
    const profiles: Record<string, InvestorProfile> = {
      guardian: {
        type: "guardian",
        title: "The Guardian",
        description: "You value security and steady growth. Your focus is on protecting what you have while building wealth slowly and safely.",
        icon: <Shield className="w-12 h-12 text-blue-400" />,
        color: "from-blue-500 to-cyan-500",
        recommendations: ["Focus on bonds and dividend stocks", "Consider index funds for stability", "Keep an emergency fund of 6+ months", "Avoid highly volatile assets"],
        investmentSuggestions: getInvestmentSuggestions("guardian"),
      },
      balanced: {
        type: "balanced",
        title: "The Balanced Achiever",
        description: "You take a measured approach, balancing growth potential with risk management. You're patient but not passive.",
        icon: <TrendingUp className="w-12 h-12 text-emerald-400" />,
        color: "from-emerald-500 to-green-500",
        recommendations: ["Mix of growth and value stocks", "Diversify across sectors", "Consider 10-20% in alternatives", "Rebalance quarterly"],
        investmentSuggestions: getInvestmentSuggestions("balanced"),
      },
      growth: {
        type: "growth",
        title: "The Growth Hunter",
        description: "You're willing to accept volatility for higher returns. You see market dips as buying opportunities.",
        icon: <Rocket className="w-12 h-12 text-orange-400" />,
        color: "from-orange-500 to-amber-500",
        recommendations: ["Focus on growth stocks and tech", "Allocate 15-25% to crypto", "Consider small-cap opportunities", "Use dollar-cost averaging"],
        investmentSuggestions: getInvestmentSuggestions("growth"),
      },
      maverick: {
        type: "maverick",
        title: "The Maverick",
        description: "You're a risk-taker with experience to back it up. You aim for maximum returns and can handle extreme volatility.",
        icon: <Zap className="w-12 h-12 text-purple-400" />,
        color: "from-purple-500 to-pink-500",
        recommendations: ["Aggressive growth strategies", "Higher crypto allocation (25%+)", "Consider leveraged products carefully", "Active trading with strict stop-losses"],
        investmentSuggestions: getInvestmentSuggestions("maverick"),
      },
    };
    return profiles[type] || profiles.balanced;
  };

  const saveProfile = async (profile: InvestorProfile, quizAnswers: Record<string, string>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your investor profile.",
        variant: "destructive",
      });
      return false;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('investor_profiles')
        .upsert({
          user_id: user.id,
          investor_type: profile.type,
          title: profile.title,
          description: profile.description,
          answers: quizAnswers,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Profile saved!",
        description: "Your investor profile has been saved successfully.",
      });
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error saving profile",
        description: "Please try again later.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleAnswer = (value: string) => {
    if (advanceTimeoutRef.current) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }

    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    advanceTimeoutRef.current = window.setTimeout(async () => {
      if (currentStep < questions.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        const profile = determineInvestorType(newAnswers);
        setInvestorProfile(profile);
        setIsComplete(true);
        await saveProfile(profile, newAnswers);
      }
    }, 300);
  };

  const handleBack = () => {
    if (advanceTimeoutRef.current) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }

    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      return;
    }

    // If the user just entered the quiz from "Start Investing / Get Started",
    // step 0 should take them back to where they came from.
    navigate(-1);
  };

  const handleRetakeQuiz = () => {
    setExistingProfile(null);
    setInvestorProfile(null);
    setIsComplete(false);
    setAnswers({});
    setCurrentStep(0);
  };

  const handleFinish = () => {
    navigate("/dashboard");
  };

  const handleInvestmentClick = (suggestionId: string) => {
    // Navigate to dashboard with the appropriate tab based on the suggestion
    if (suggestionId.includes("crypto")) {
      navigate("/dashboard?tab=crypto");
    } else if (suggestionId.includes("stocks") || suggestionId.includes("dividend")) {
      navigate("/dashboard?tab=us");
    } else {
      navigate("/dashboard");
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "Low":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "High":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "Very High":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isComplete && investorProfile) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl w-full mx-auto"
        >
          {/* Animated Archetype Card - Main Hero Section */}
          <div className="mb-8">
            <InvestorArchetypeCard
              type={investorProfile.type as "guardian" | "balanced" | "growth" | "maverick"}
              title={investorProfile.title}
              description={investorProfile.description}
              traits={investorProfile.recommendations}
            />
          </div>

          {/* Expandable Details Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
          >
            <Button
              variant="ghost"
              className="w-full mb-4 gap-2"
              onClick={() => setShowDetails(!showDetails)}
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${showDetails ? "rotate-180" : ""}`} />
              {showDetails ? "Hide" : "Show"} Investment Recommendations
            </Button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  {/* Investment Recommendations */}
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Recommended Investments for You
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {investorProfile.investmentSuggestions.map((suggestion, index) => (
                        <motion.div
                          key={suggestion.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card
                            className="p-5 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-primary/50 h-full"
                            onClick={() => handleInvestmentClick(suggestion.id)}
                          >
                            <div className="flex items-start gap-4 mb-3">
                              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${suggestion.color} flex items-center justify-center text-white shadow-md`}>
                                {suggestion.icon}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{suggestion.name}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${getRiskBadgeColor(suggestion.riskLevel)}`}>
                                  {suggestion.riskLevel} Risk
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Suggested Allocation:</span>
                                <span className="font-semibold text-primary">{suggestion.allocation}</span>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Examples:</p>
                                <div className="flex flex-wrap gap-1">
                                  {suggestion.examples.slice(0, 3).map((example, i) => (
                                    <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                      {example}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-border">
                              <Button variant="ghost" size="sm" className="w-full gap-2 text-primary">
                                Explore {suggestion.name} <ArrowRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Tips Section */}
                  <Card className="p-6 bg-muted/50 mb-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      Quick Tips for Your Profile
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {investorProfile.recommendations.map((rec, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3 text-muted-foreground"
                        >
                          <span
                            className={`w-6 h-6 rounded-full bg-gradient-to-br ${investorProfile.color} text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5`}
                          >
                            {index + 1}
                          </span>
                          {rec}
                        </motion.li>
                      ))}
                    </ul>
                  </Card>

                  {/* Investment Automation Section */}
                  <Card className="p-6 mb-6 border-2 border-primary/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Automate Your Investments</h3>
                        <p className="text-sm text-muted-foreground">Set up recurring investments to build wealth consistently</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Amount Input */}
                      <div>
                        <Label htmlFor="automation-amount" className="text-sm font-medium mb-2 block">
                          Investment Amount (USD)
                        </Label>
                        <Input
                          id="automation-amount"
                          type="number"
                          placeholder="Enter amount (e.g., 100)"
                          value={automationAmount}
                          onChange={(e) => setAutomationAmount(e.target.value)}
                          className="max-w-xs"
                        />
                      </div>

                      {/* Frequency Selection */}
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Investment Frequency</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {automationFrequencies.map((freq) => (
                            <motion.button
                              key={freq.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedFrequency(freq.id)}
                              className={`p-4 rounded-xl border-2 transition-all text-left ${
                                selectedFrequency === freq.id
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  selectedFrequency === freq.id ? "bg-primary text-primary-foreground" : "bg-muted"
                                }`}>
                                  {freq.icon}
                                </div>
                                <div>
                                  <p className="font-semibold">{freq.label}</p>
                                  <p className="text-xs text-muted-foreground">{freq.description}</p>
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Automation Summary */}
                      {selectedFrequency && automationAmount && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-lg bg-primary/5 border border-primary/20"
                        >
                          <p className="text-sm">
                            <span className="font-semibold text-primary">Your plan:</span> Invest{" "}
                            <span className="font-bold">${automationAmount}</span>{" "}
                            <span className="font-medium">
                              {selectedFrequency === "weekly" && "every week"}
                              {selectedFrequency === "monthly" && "every month"}
                              {selectedFrequency === "quarterly" && "every quarter"}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Estimated yearly investment:{" "}
                            <span className="font-semibold">
                              ${(
                                parseFloat(automationAmount) *
                                (selectedFrequency === "weekly" ? 52 : selectedFrequency === "monthly" ? 12 : 4)
                              ).toLocaleString()}
                            </span>
                          </p>
                        </motion.div>
                      )}

                      <Button
                        onClick={() => {
                          if (!automationAmount || !selectedFrequency) {
                            toast({
                              title: "Setup incomplete",
                              description: "Please enter an amount and select a frequency",
                              variant: "destructive",
                            });
                            return;
                          }
                          toast({
                            title: "Automation saved!",
                            description: `You'll invest $${automationAmount} ${selectedFrequency}. Configure payment in Wallet.`,
                          });
                        }}
                        className="w-full sm:w-auto gap-2"
                        variant={selectedFrequency && automationAmount ? "default" : "outline"}
                      >
                        <RefreshCw className="w-4 h-4" />
                        {selectedFrequency && automationAmount ? "Enable Automation" : "Set Up Automation"}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
            className="flex flex-col sm:flex-row gap-3 mt-6"
          >
            <Button size="lg" onClick={handleFinish} className="flex-1 gap-2" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  Go to Dashboard <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
            {existingProfile && (
              <Button size="lg" variant="outline" onClick={handleRetakeQuiz} className="gap-2">
                Retake Quiz
              </Button>
            )}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
          >
            <Star className="w-4 h-4" />
            Investment Profile Quiz
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            What type of InveStar are you?
          </h1>
          <p className="text-muted-foreground">Answer a few questions to discover your investor profile</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} of {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8 md:p-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{currentQuestion.question}</h2>

              <div className="grid gap-3">
                {currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleAnswer(option.value)}
                    className={`w-full p-5 text-left rounded-xl border-2 transition-all duration-200 hover:border-primary hover:bg-primary/5 hover:scale-[1.02] ${
                      answers[currentQuestion.id] === option.value ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    <div className="font-semibold text-lg mb-1">{option.label}</div>
                    {option.description && <div className="text-sm text-muted-foreground">{option.description}</div>}
                  </motion.button>
                ))}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">Click to select your answer</p>
        </div>
      </div>
    </div>
  );
};

export default InvestorQuiz;
