import { useState, useRef, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Send, Loader2, Clock, TrendingUp, Shield, DollarSign, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

type Message = { role: "user" | "assistant"; content: string };
type Mode = "general" | "portfolio" | "risk" | "income";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/investar-ai-chat`;

const QUICK_PROMPTS = [
  "DSE outlook this week?",
  "Sanchaypatra vs FD rates?",
  "Best NRB investment options?",
  "bKash vs Nagad comparison",
  "BDT inflation impact on savings",
];

const MODES: { key: Mode; label: string; icon: React.ReactNode }[] = [
  { key: "general", label: "General", icon: <Brain className="w-4 h-4" /> },
  { key: "portfolio", label: "Portfolio", icon: <TrendingUp className="w-4 h-4" /> },
  { key: "risk", label: "Risk", icon: <Shield className="w-4 h-4" /> },
  { key: "income", label: "Income", icon: <DollarSign className="w-4 h-4" /> },
];

const InveStarAI = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("general");
  const [bdTime, setBdTime] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Update BD time
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const bd = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Dhaka",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: true,
      }).format(now);
      setBdTime(bd);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check DSE open status (Sun-Thu 10:00-14:30 BST)
  const isDSEOpen = () => {
    const now = new Date();
    const bdNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
    const day = bdNow.getDay();
    const hours = bdNow.getHours();
    const mins = bdNow.getMinutes();
    const timeVal = hours * 60 + mins;
    return day >= 0 && day <= 4 && timeVal >= 600 && timeVal <= 870; // Sun=0 to Thu=4, 10:00-14:30
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          mode,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
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
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      toast({ title: "AI Error", description: e.message, variant: "destructive" });
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">InveStar AI</h1>
              <p className="text-sm text-muted-foreground">24/7 Bangladesh Market Analyst</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-mono text-xs">{bdTime} BST</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isDSEOpen() ? "bg-accent/10 border-accent/30 text-accent" : "bg-destructive/10 border-destructive/30 text-destructive"}`}>
              <div className={`w-2 h-2 rounded-full ${isDSEOpen() ? "bg-accent animate-pulse" : "bg-destructive"}`} />
              <span className="text-xs font-medium">{isDSEOpen() ? "DSE Open" : "DSE Closed"}</span>
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 mb-4">
          {MODES.map(m => (
            <Button
              key={m.key}
              variant={mode === m.key ? "default" : "outline"}
              size="sm"
              onClick={() => setMode(m.key)}
              className="gap-2"
            >
              {m.icon}
              {m.label}
            </Button>
          ))}
        </div>

        {/* Chat Area */}
        <Card className="mb-4 min-h-[400px] max-h-[60vh] overflow-y-auto">
          <CardContent className="p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary/40" />
                <h3 className="text-lg font-semibold mb-2">আমি InveStar AI 👋</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Ask me anything about Bangladesh capital markets, DSE stocks, Sanchaypatra, NRB investments, or cross-border remittance.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_PROMPTS.map(q => (
                    <Button key={q} variant="outline" size="sm" onClick={() => sendMessage(q)} className="text-xs">
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-3 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/50 border border-border"}`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="bg-muted/50 border border-border rounded-xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>
        </Card>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="Ask about DSE, Sanchaypatra, NRB rules..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()} className="gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-3">
          InveStar AI provides educational content only — not licensed financial advice. Always do your own research.
        </p>
      </div>
      <Footer />
    </div>
  );
};

export default InveStarAI;
