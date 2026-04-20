import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Volume2, StopCircle, Compass, TrendingUp, Shield, Wallet, BarChart3, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import MarketDataPanel from "@/components/MarketDataPanel";
import VoiceChatButton from "@/components/VoiceChatButton";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import VoiceWaveform from "@/components/VoiceWaveform";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

const QUICK_ACTIONS = [
  { icon: TrendingUp, label: "Trade Ideas", prompt: "What are your top 3 trade ideas for today based on current market conditions?" },
  { icon: Shield, label: "BD Rules", prompt: "What can I invest in as a Bangladeshi resident? Check my eligibility." },
  { icon: Wallet, label: "My Portfolio", prompt: "Review my current portfolio and suggest improvements based on my holdings." },
  { icon: BarChart3, label: "DSE Analysis", prompt: "Analyze the current DSE market. Which Bangladesh stocks look promising?" },
  { icon: Globe, label: "NRB Investing", prompt: "I'm an NRB. What are my best options for investing from abroad in Bangladesh?" },
];

type Message = {
  role: "user" | "assistant";
  content: string;
};

const AICoach = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Welcome to **InveStar Copilot**! I'm your AI investment advisor.\n\nI can:\n- 📊 Suggest specific trades with entry/target/stop prices\n- 🇧🇩 Check Bangladesh regulatory eligibility for any investment\n- 💼 Analyze your portfolio and recommend improvements\n- 📈 Provide real-time market data and analysis\n\nWhat would you like to explore?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastAssistantMessageRef = useRef<string>("");

  const handleVoiceTranscript = useCallback((text: string) => {
    setInput(text);
    // Ensure auto-speak is enabled when using voice input
    setAutoSpeak(true);
    // Auto-send the voice message
    setTimeout(() => {
      const sendButton = document.getElementById("send-message-btn");
      sendButton?.click();
    }, 100);
  }, []);

  const {
    isListening,
    isSpeaking: isVoiceSpeaking,
    isSupported,
    startListening,
    stopListening,
    stopSpeaking: stopVoiceSpeaking,
  } = useVoiceChat({
    onTranscript: handleVoiceTranscript,
  });

  // Use ElevenLabs TTS for natural female voice
  const {
    speak: speakElevenLabs,
    stopSpeaking: stopElevenLabsSpeaking,
    isSpeaking: isElevenLabsSpeaking,
    isLoading: isTTSLoading,
  } = useElevenLabsTTS({
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah - warm conversational voice
  });

  const isSpeaking = isVoiceSpeaking || isElevenLabsSpeaking;
  const stopSpeaking = () => {
    stopVoiceSpeaking();
    stopElevenLabsSpeaking();
  };

  // Auto-stop speaking when user starts listening (interrupt)
  useEffect(() => {
    if (isListening && isElevenLabsSpeaking) {
      stopElevenLabsSpeaking();
    }
  }, [isListening, isElevenLabsSpeaking, stopElevenLabsSpeaking]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-focus the input field when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const streamChat = async (userMessage: Message): Promise<string> => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`;
    let assistantContent = "";

    try {
      // Get the user's session token for authentication
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
        body: JSON.stringify({ messages: [...messages, userMessage] }),
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

      // Flush remaining buffer
      if (textBuffer.trim()) {
        for (const raw of textBuffer.split("\n")) {
          if (!raw || raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
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
          } catch {}
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

    // Auto-speak the response if enabled using ElevenLabs
    if (autoSpeak && response && response !== lastAssistantMessageRef.current) {
      lastAssistantMessageRef.current = response;
      // Clean up markdown and speak with ElevenLabs natural voice
      const cleanText = response
        .replace(/[#*_`]/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      speakElevenLabs(cleanText);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Compass className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-bold">InveStar Copilot</h1>
            <Badge variant="secondary" className="text-xs">Advisor Mode</Badge>
          </div>
          <p className="text-muted-foreground">
            AI-powered trade suggestions • BD compliance checks • Portfolio analysis
          </p>
          {isElevenLabsSpeaking && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <VoiceWaveform isActive={isElevenLabsSpeaking} barCount={7} className="h-6" />
              <span className="text-sm text-primary animate-pulse">Copilot is speaking...</span>
            </div>
          )}
        </div>

        {/* Quick Action Chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="gap-1.5 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                onClick={() => {
                  setInput(action.prompt);
                  setTimeout(() => document.getElementById("send-message-btn")?.click(), 100);
                }}
                disabled={isLoading}
              >
                <Icon className="w-3.5 h-3.5" />
                {action.label}
              </Button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Section */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-280px)] flex flex-col">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-accent-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <VoiceChatButton
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  isSupported={isSupported}
                  onStartListening={startListening}
                  onStopListening={stopListening}
                  onStopSpeaking={stopSpeaking}
                  disabled={isLoading}
                />
                {isElevenLabsSpeaking && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-[60px] w-[60px] animate-pulse"
                    onClick={stopSpeaking}
                  >
                    <StopCircle className="w-6 h-6" />
                  </Button>
                )}
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? "Listening..." : isElevenLabsSpeaking ? "AI is speaking... click stop or start talking to interrupt" : "Ask me about investments, portfolio management, or market trends..."}
                  className="min-h-[60px] resize-none"
                  disabled={isLoading || isListening}
                  autoFocus
                />
                <Button
                  id="send-message-btn"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-[60px] w-[60px]"
                >
                  <Send className="w-5 h-5" />
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant={autoSpeak ? "default" : "outline"}
                      size="icon"
                      className="h-[60px] w-[60px]"
                      onClick={() => setAutoSpeak(!autoSpeak)}
                    >
                      <Volume2 className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {autoSpeak ? "Auto-speak enabled" : "Auto-speak disabled"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            </Card>
          </div>

          {/* Market Data Panel */}
          <div className="lg:col-span-1">
            <MarketDataPanel />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AICoach;
