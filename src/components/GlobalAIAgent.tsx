import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, X, Send, Mic, MicOff, Volume2, VolumeX, Minimize2, Maximize2, Sparkles, Loader2, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import VoiceWaveform from "@/components/VoiceWaveform";

type Message = {
  role: "user" | "assistant";
  content: string;
};

interface PortfolioData {
  holdings: Array<{
    symbol: string;
    name: string;
    shares: number;
    avg_cost: number;
  }>;
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalReturnPct: number;
}

const getContextForRoute = (pathname: string): string => {
  switch (pathname) {
    case "/portfolio":
      return "The user is viewing their Portfolio page which shows their stock holdings, watchlist, and price alerts. Help them analyze their investments.";
    case "/net-worth":
      return "The user is viewing their Net Worth page which tracks their total assets, liabilities, and net worth over time. Help them understand their financial position.";
    case "/dashboard":
      return "The user is viewing the Dashboard with an overview of their investments and market data.";
    case "/virtual-trading":
      return "The user is on the Virtual Trading page where they can practice trading with virtual money.";
    case "/wallet":
      return "The user is on their Wallet page managing their funds and crypto holdings.";
    default:
      return "Help the user with investment strategies, portfolio management, and financial planning.";
  }
};

const GlobalAIAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI Investment Coach with a natural voice. Ask me anything about your portfolio, market trends, or investment strategies. I can also analyze your current page with your real portfolio data!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastAssistantMessageRef = useRef<string>("");
  const location = useLocation();

  // ElevenLabs TTS for natural female voice
  const { speak: elevenLabsSpeak, stopSpeaking: elevenLabsStopSpeaking, isSpeaking: elevenLabsIsSpeaking, isLoading: ttsLoading } = useElevenLabsTTS();

  const handleVoiceTranscript = useCallback((text: string) => {
    setInput(text);
    // Enable auto-speak when using voice input
    setAutoSpeak(true);
    setTimeout(() => {
      const sendButton = document.getElementById("global-ai-send-btn");
      sendButton?.click();
    }, 100);
  }, []);

  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
  } = useVoiceChat({
    onTranscript: handleVoiceTranscript,
  });

  // Fetch portfolio data on mount and when user changes
  useEffect(() => {
    const fetchPortfolioData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        // Fetch holdings
        const { data: holdings } = await supabase
          .from('portfolio_holdings')
          .select('*')
          .eq('user_id', user.id);

        if (!holdings || holdings.length === 0) {
          setPortfolioData(null);
          return;
        }

        // Fetch real-time prices for holdings
        const symbols = holdings.map(h => h.symbol);
        const { data: priceData } = await supabase.functions.invoke('fetch-real-time-prices', {
          body: { symbols }
        });

        const prices: Record<string, number> = priceData?.prices || {};
        
        let totalValue = 0;
        let totalCost = 0;

        const enrichedHoldings = holdings.map(h => {
          const currentPrice = prices[h.symbol] || h.avg_cost;
          const value = h.shares * currentPrice;
          const cost = h.shares * h.avg_cost;
          totalValue += value;
          totalCost += cost;
          return {
            ...h,
            currentPrice,
            value,
            gainLoss: value - cost,
            returnPct: ((value - cost) / cost) * 100
          };
        });

        setPortfolioData({
          holdings: enrichedHoldings,
          totalValue,
          totalCost,
          totalGainLoss: totalValue - totalCost,
          totalReturnPct: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0
        });
      } catch (error) {
        console.error('Error fetching portfolio data:', error);
      }
    };

    fetchPortfolioData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchPortfolioData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-stop speaking when user starts listening (interrupt)
  useEffect(() => {
    if (isListening && elevenLabsIsSpeaking) {
      elevenLabsStopSpeaking();
    }
  }, [isListening, elevenLabsIsSpeaking, elevenLabsStopSpeaking]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const buildPortfolioContext = (): string => {
    if (!portfolioData) return "";
    
    const holdingsSummary = portfolioData.holdings.map(h => 
      `${h.symbol} (${h.name}): ${h.shares} shares @ $${h.avg_cost.toFixed(2)} avg`
    ).join(', ');

    return `
REAL PORTFOLIO DATA:
- Total Portfolio Value: $${portfolioData.totalValue.toFixed(2)}
- Total Cost Basis: $${portfolioData.totalCost.toFixed(2)}
- Total Gain/Loss: $${portfolioData.totalGainLoss.toFixed(2)} (${portfolioData.totalReturnPct.toFixed(2)}%)
- Holdings: ${holdingsSummary}
`;
  };

  const streamChat = async (userMessage: Message): Promise<string> => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/investar-ai-chat`;
    let assistantContent = "";
    
    // Build context with portfolio data
    const pageContext = getContextForRoute(location.pathname);
    const portfolioContext = buildPortfolioContext();
    const fullContext = `${pageContext}\n\n${portfolioContext}`;

    try {
      // Get user's session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Please sign in to use the AI Coach.");
        return assistantContent;
      }

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          context: fullContext
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again in a moment.");
          return assistantContent;
        }
        if (response.status === 402) {
          toast.error("AI service requires payment. Please contact support.");
          return assistantContent;
        }
        throw new Error("Failed to start chat stream");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to send message. Please try again.");
    }

    return assistantContent;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const response = await streamChat(userMessage);
    setIsLoading(false);

    if (autoSpeak && response && response !== lastAssistantMessageRef.current) {
      lastAssistantMessageRef.current = response;
      const cleanText = response
        .replace(/[#*_`]/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\n+/g, ". ");
      elevenLabsSpeak(cleanText);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const analyzeCurrentPage = async () => {
    if (isLoading) return;
    
    const portfolioInfo = portfolioData 
      ? `My portfolio has ${portfolioData.holdings.length} holdings worth $${portfolioData.totalValue.toFixed(2)} with ${portfolioData.totalReturnPct >= 0 ? 'gains' : 'losses'} of ${portfolioData.totalReturnPct.toFixed(2)}%.`
      : "";

    const pageAnalysis = {
      "/portfolio": `Analyze my portfolio performance in detail. ${portfolioInfo} Show my top gainers and losers, and suggest any rebalancing.`,
      "/net-worth": `Analyze my net worth trends. ${portfolioInfo} Give me insights on how to improve my financial position.`,
      "/dashboard": `Give me a summary of my investment performance. ${portfolioInfo} What market alerts should I know about?`,
      "/virtual-trading": "Help me practice trading strategies and suggest some stocks to paper trade based on current market conditions.",
      "/wallet": "Review my wallet holdings and suggest optimal allocation.",
    };
    
    const analysisPrompt = pageAnalysis[location.pathname as keyof typeof pageAnalysis] || 
      `Give me personalized investment advice. ${portfolioInfo}`;
    
    // Send the message directly instead of just setting input
    const userMessage: Message = { role: "user", content: analysisPrompt };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const response = await streamChat(userMessage);
    setIsLoading(false);

    if (autoSpeak && response && response !== lastAssistantMessageRef.current) {
      lastAssistantMessageRef.current = response;
      const cleanText = response
        .replace(/[#*_`]/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\n+/g, ". ");
      elevenLabsSpeak(cleanText);
    }
  };

  if (!isOpen) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 lg:bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-br from-primary to-accent hover:scale-105 transition-transform"
            size="icon"
          >
            <Bot className="w-6 h-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">AI Investment Coach</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Card className={cn(
      "fixed z-50 shadow-2xl border-primary/20 transition-all duration-300",
      isMinimized 
        ? "bottom-20 lg:bottom-6 right-6 w-80 h-14" 
        : "bottom-20 lg:bottom-4 right-4 left-4 sm:left-auto w-[calc(100vw-2rem)] sm:w-96 max-w-[calc(100vw-1rem)] h-[60vh] sm:h-[500px] max-h-[calc(100vh-6rem)]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">AI Coach</span>
          {isListening && (
            <span className="text-xs text-primary animate-pulse">Listening...</span>
          )}
          {(elevenLabsIsSpeaking || ttsLoading) && (
            <span className="text-xs text-accent flex items-center gap-1">
              {ttsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <VoiceWaveform isActive={elevenLabsIsSpeaking} barCount={4} />}
              {ttsLoading ? "Loading..." : "Speaking"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 h-[calc(60vh-200px)] sm:h-[340px] p-3" ref={scrollRef}>
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-2",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 max-w-[85%] text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-primary-foreground animate-pulse" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce delay-100" />
                      <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Analyze Button */}
          <div className="px-3 py-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
              onClick={analyzeCurrentPage}
            >
              <Sparkles className="w-3 h-3" />
              Analyze Current Page {portfolioData ? "(with live data)" : ""}
            </Button>
          </div>

          {/* Input */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              {isSupported && (
                <Button
                  type="button"
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                  className={cn("h-9 w-9 shrink-0", isListening && "animate-pulse")}
                  onClick={isListening ? stopListening : startListening}
                  disabled={isLoading}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}
              {elevenLabsIsSpeaking && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-9 w-9 shrink-0 animate-pulse"
                  onClick={elevenLabsStopSpeaking}
                >
                  <StopCircle className="w-4 h-4" />
                </Button>
              )}
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? "Listening..." : elevenLabsIsSpeaking ? "AI is speaking... click stop or start talking" : "Ask anything..."}
                className="min-h-[36px] max-h-[80px] resize-none text-sm"
                disabled={isLoading || isListening}
              />
              <Button
                id="global-ai-send-btn"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-9 w-9 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={autoSpeak ? "default" : "outline"}
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => {
                      if (elevenLabsIsSpeaking) elevenLabsStopSpeaking();
                      setAutoSpeak(!autoSpeak);
                    }}
                  >
                    {elevenLabsIsSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {autoSpeak ? "Voice enabled (ElevenLabs)" : "Enable voice"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default GlobalAIAgent;
