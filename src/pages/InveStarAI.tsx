import { useState, useRef, useEffect, useCallback } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Send, Loader2, Clock, TrendingUp, Shield, DollarSign, Sparkles, Search, Database, Globe, ExternalLink, CreditCard, RefreshCw, Scale, Rocket, Save, AlertTriangle, BarChart3, Mic, MicOff, Volume2, StopCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import telegramLogo from "@/assets/telegram-logo.png";
import whatsappLogo from "@/assets/whatsapp-logo.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import VoiceWaveform from "@/components/VoiceWaveform";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Message = { role: "user" | "assistant"; content: string };
type ToolStep = { tool: string; args: any; result?: any; status: "calling" | "done" };
type Mode = "general" | "portfolio" | "risk" | "income" | "payments" | "fx" | "compliance" | "startup" | "compare";

interface FxPair {
  pair: string;
  rate: number;
  decimals: number;
  change: number;
}

const AGENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/investar-agent`;

const INITIAL_FX: FxPair[] = [
  { pair: "USD/JPY", rate: 149.82, decimals: 2, change: -0.18 },
  { pair: "EUR/JPY", rate: 162.44, decimals: 2, change: 0.09 },
  { pair: "GBP/USD", rate: 1.2938, decimals: 4, change: 0.11 },
  { pair: "EUR/USD", rate: 1.0842, decimals: 4, change: -0.05 },
  { pair: "USD/BDT", rate: 121.50, decimals: 2, change: 0.02 },
];

const QUICK_PROMPTS = [
  { tag: "Pay", tagColor: "bg-blue-900/40 text-blue-300", label: "Best route USD → JPY ($50k)", prompt: "What is the cheapest and fastest way to send $50,000 from the US to Japan? Compare bank wire vs fintech options with fees and transfer times." },
  { tag: "Inv", tagColor: "bg-emerald-900/40 text-emerald-300", label: "Japan vs US equities for JPY investor", prompt: "Compare investing in Japanese equities vs US equities for a Japan-based investor. What are the tax implications, currency risk, and best account structures?" },
  { tag: "FX", tagColor: "bg-amber-900/40 text-amber-300", label: "Hedging USD funding for JP startup", prompt: "What FX hedging strategies should a Japanese startup consider when receiving USD investment from a US VC? What are the practical options and costs?" },
  { tag: "Reg", tagColor: "bg-purple-900/40 text-purple-300", label: "US VC → Japan compliance", prompt: "What compliance requirements apply when a Japanese company receives investment from a US VC fund? Cover FEFTA, FATCA, corporate structure, and reporting." },
  { tag: "DSE", tagColor: "bg-cyan-900/40 text-cyan-300", label: "DSE outlook this week", prompt: "DSE outlook this week?" },
  { tag: "📊", tagColor: "bg-primary/20 text-primary", label: "Analyze my portfolio", prompt: "Analyze my portfolio" },
];

const MODES: { key: Mode; label: string; icon: React.ReactNode; placeholder: string }[] = [
  { key: "general", label: "General", icon: <Brain className="w-4 h-4" />, placeholder: "Ask about any market, stock, or financial topic…" },
  { key: "portfolio", label: "Portfolio", icon: <TrendingUp className="w-4 h-4" />, placeholder: "Ask about your portfolio allocation and rebalancing…" },
  { key: "payments", label: "Payments", icon: <CreditCard className="w-4 h-4" />, placeholder: "Ask about transfer routes, fees, and payment providers…" },
  { key: "fx", label: "FX Strategy", icon: <RefreshCw className="w-4 h-4" />, placeholder: "Ask about currency hedging, USD/JPY, or FX risk…" },
  { key: "compliance", label: "Compliance", icon: <Scale className="w-4 h-4" />, placeholder: "Ask about FBAR, FATCA, FEFTA, or AML/KYC…" },
  { key: "startup", label: "Startup/VC", icon: <Rocket className="w-4 h-4" />, placeholder: "Ask about KK + C-Corp structures, cap tables, or VC…" },
  { key: "compare", label: "Compare", icon: <BarChart3 className="w-4 h-4" />, placeholder: "Compare banks, fintechs, or brokers for a specific need…" },
  { key: "risk", label: "Risk", icon: <Shield className="w-4 h-4" />, placeholder: "Ask about downside risk, volatility, and hedging…" },
  { key: "income", label: "Income", icon: <DollarSign className="w-4 h-4" />, placeholder: "Ask about dividends, bonds, Sanchaypatra, or REITs…" },
];

const TOOL_ICONS: Record<string, React.ReactNode> = {
  web_search: <Globe className="w-3.5 h-3.5" />,
  scrape_url: <Search className="w-3.5 h-3.5" />,
  get_portfolio: <Database className="w-3.5 h-3.5" />,
  get_wallet_balance: <Database className="w-3.5 h-3.5" />,
  get_watchlist: <Database className="w-3.5 h-3.5" />,
  get_virtual_portfolio: <Database className="w-3.5 h-3.5" />,
  get_recent_transactions: <Database className="w-3.5 h-3.5" />,
  get_price_alerts: <Database className="w-3.5 h-3.5" />,
  get_financial_goals: <Database className="w-3.5 h-3.5" />,
};

const TOOL_LABELS: Record<string, string> = {
  web_search: "Searching the web",
  scrape_url: "Scraping page",
  get_portfolio: "Checking portfolio",
  get_wallet_balance: "Checking wallet",
  get_watchlist: "Reading watchlist",
  get_virtual_portfolio: "Checking virtual portfolio",
  get_recent_transactions: "Reading transactions",
  get_price_alerts: "Checking alerts",
  get_financial_goals: "Reading goals",
};

const InveStarAI = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("general");
  const [bdTime, setBdTime] = useState("");
  const [toolSteps, setToolSteps] = useState<ToolStep[]>([]);
  const [fxPairs, setFxPairs] = useState<FxPair[]>(INITIAL_FX);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastAssistantRef = useRef<string>("");
  const { toast } = useToast();

  const handleVoiceTranscript = (text: string) => {
    setInput(text);
    setAutoSpeak(true);
    setTimeout(() => {
      sendMessage(text);
    }, 100);
  };

  const {
    isListening,
    isSpeaking: isVoiceSpeaking,
    isSupported: voiceSupported,
    startListening,
    stopListening,
    stopSpeaking: stopVoiceSpeaking,
  } = useVoiceChat({ onTranscript: handleVoiceTranscript });

  const {
    speak: speakElevenLabs,
    stopSpeaking: stopElevenLabsSpeaking,
    isSpeaking: isElevenLabsSpeaking,
  } = useElevenLabsTTS({ voiceId: "EXAVITQu4vr4xnSDxMaL" });

  const isSpeaking = isVoiceSpeaking || isElevenLabsSpeaking;
  const stopSpeaking = () => { stopVoiceSpeaking(); stopElevenLabsSpeaking(); };

  useEffect(() => {
    if (isListening && isElevenLabsSpeaking) stopElevenLabsSpeaking();
  }, [isListening, isElevenLabsSpeaking, stopElevenLabsSpeaking]);

  const currentPlaceholder = MODES.find(m => m.key === mode)?.placeholder || "Ask anything…";

  useEffect(() => {
    const update = () => {
      setBdTime(new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
      }).format(new Date()));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulated FX tick every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFxPairs(prev => prev.map(p => {
        const delta = (Math.random() - 0.49) * p.rate * 0.0012;
        const newRate = p.rate + delta;
        const pct = parseFloat(((delta / p.rate) * 100).toFixed(2));
        return { ...p, rate: parseFloat(newRate.toFixed(p.decimals)), change: pct };
      }));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const isDSEOpen = () => {
    const bdNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
    const day = bdNow.getDay();
    const timeVal = bdNow.getHours() * 60 + bdNow.getMinutes();
    return day >= 0 && day <= 4 && timeVal >= 600 && timeVal <= 870;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, toolSteps]);

  const saveConversation = async () => {
    if (messages.length === 0) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Sign in required", description: "Please sign in to save conversations.", variant: "destructive" });
        return;
      }
      const title = messages.find(m => m.role === "user")?.content.slice(0, 60) ?? "Conversation";
      await supabase.from("ai_conversations").insert({
        user_id: user.id,
        title,
        messages: messages as any,
        mode,
      });
      toast({ title: "Saved!", description: "Conversation saved successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to save conversation.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setToolSteps([]);

    const allMessages = [...messages, userMsg];

    let userId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // Non-fatal: user may be anonymous / auth unavailable
    }

    let assistantSoFar = "";

    try {
      const resp = await fetch(AGENT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          mode,
          userId,
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

            if (parsed.type === "tool_call") {
              setToolSteps(prev => [...prev, { tool: parsed.tool, args: parsed.args, status: "calling" }]);
            } else if (parsed.type === "tool_result") {
              setToolSteps(prev => prev.map((s, i) =>
                i === prev.length - 1 ? { ...s, result: parsed.result, status: "done" } : s
              ));
            } else if (parsed.type === "content") {
              assistantSoFar += parsed.content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            } else if (parsed.type === "error") {
              throw new Error(parsed.content);
            }
          } catch (e) {
            if (e instanceof Error && e.message !== "Unknown error") {
              if (!(e instanceof SyntaxError)) throw e;
            }
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
      // Auto-speak the response
      if (autoSpeak && assistantSoFar && assistantSoFar !== lastAssistantRef.current) {
        lastAssistantRef.current = assistantSoFar;
        const cleanText = assistantSoFar.replace(/[#*_`]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
        speakElevenLabs(cleanText);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex gap-6">
          {/* ── LEFT SIDEBAR ── */}
          <div className="hidden lg:flex flex-col w-[260px] flex-shrink-0 gap-4">
            {/* FX Rates */}
            <Card className="border-border/50">
              <CardContent className="p-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" /> Live FX Rates
                </h3>
                <div className="space-y-1.5">
                  {fxPairs.map(fx => (
                    <div key={fx.pair} className="flex items-center justify-between text-sm py-1 px-1.5 rounded hover:bg-muted/30 transition-colors">
                      <span className="font-mono text-xs text-muted-foreground">{fx.pair}</span>
                      <span className="font-mono text-xs font-medium text-foreground">{fx.rate.toFixed(fx.decimals)}</span>
                      <span className={`font-mono text-[10px] ${fx.change >= 0 ? "text-accent" : "text-destructive"}`}>
                        {fx.change >= 0 ? "▲" : "▼"} {Math.abs(fx.change)}%
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-muted-foreground mt-2 text-center">Indicative rates · Updated every 8s</p>
              </CardContent>
            </Card>

            {/* Capabilities / Modes */}
            <Card className="border-border/50">
              <CardContent className="p-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Agent Capabilities</h3>
                <div className="space-y-1">
                  {MODES.map(m => (
                    <button
                      key={m.key}
                      onClick={() => setMode(m.key)}
                      className={`flex items-center gap-2 w-full px-2.5 py-2 rounded-md text-left text-sm transition-all border ${
                        mode === m.key
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "border-transparent hover:bg-muted/50 hover:border-border/50 text-muted-foreground"
                      }`}
                    >
                      {m.icon}
                      <span className="font-medium">{m.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Prompts */}
            <Card className="border-border/50">
              <CardContent className="p-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Prompts</h3>
                <div className="space-y-1.5">
                  {QUICK_PROMPTS.map(qp => (
                    <button
                      key={qp.label}
                      onClick={() => sendMessage(qp.prompt)}
                      className="text-left w-full px-2.5 py-2 rounded-md bg-muted/30 border border-border/30 text-xs hover:border-border hover:bg-muted/50 transition-all leading-snug"
                    >
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mr-1.5 ${qp.tagColor}`}>
                        {qp.tag}
                      </span>
                      <span className="text-muted-foreground">{qp.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── MAIN AREA ── */}
          <div className="flex-1 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                    InveStar AI Coach
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground">gemini-2.5-flash</span>
                  </h1>
                  <p className="text-xs text-muted-foreground">Cross-Border Finance · Japan–US · Bangladesh</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-border">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-[10px] text-accent">Online</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-border">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="font-mono text-[10px]">{bdTime} BST</span>
                </div>
                <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${isDSEOpen() ? "bg-accent/10 border-accent/30 text-accent" : "bg-destructive/10 border-destructive/30 text-destructive"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isDSEOpen() ? "bg-accent animate-pulse" : "bg-destructive"}`} />
                  <span className="text-[10px] font-medium">{isDSEOpen() ? "DSE Open" : "DSE Closed"}</span>
                </div>
                {messages.length > 0 && (
                  <Button variant="outline" size="sm" onClick={saveConversation} disabled={saving} className="gap-1.5 text-xs h-7">
                    <Save className="w-3 h-3" />
                    {saving ? "Saving…" : "Save"}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setShowDisclaimer(true)} className="gap-1 text-xs h-7 border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
                  <AlertTriangle className="w-3 h-3" />
                  Disclaimer
                </Button>
              </div>
            </div>

            {/* Mode Selector (mobile + tablet) */}
            <div className="flex gap-2 mb-3 flex-wrap lg:hidden">
              {MODES.map(m => (
                <Button key={m.key} variant={mode === m.key ? "default" : "outline"} size="sm" onClick={() => setMode(m.key)} className="gap-1.5 text-xs">
                  {m.icon}{m.label}
                </Button>
              ))}
            </div>

            {/* Messaging Platform Links */}
            <div className="flex gap-3 mb-4">
              <a href="https://t.me/investar_coach_bot" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[hsl(200,80%,95%)] dark:bg-[hsl(200,60%,20%)] border border-[hsl(200,60%,80%)] dark:border-[hsl(200,50%,40%)] hover:shadow-md transition-all hover:scale-[1.02]">
                <img src={telegramLogo} alt="Telegram" className="w-7 h-7" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Chat on Telegram</p>
                  <p className="text-[10px] text-muted-foreground">@investar_coach_bot</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
              </a>
              <a href="https://api.whatsapp.com/send?phone=447786211734&text=Hi%20InveStar%2C%20I%27d%20like%20to%20get%20started" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[hsl(140,60%,95%)] dark:bg-[hsl(140,40%,20%)] border border-[hsl(140,40%,75%)] dark:border-[hsl(140,40%,40%)] hover:shadow-md transition-all hover:scale-[1.02]">
                <img src={whatsappLogo} alt="WhatsApp" className="w-7 h-7" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Chat on WhatsApp</p>
                  <p className="text-[10px] text-muted-foreground">Tap to start instantly</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
              </a>
            </div>

            {/* Chat Area */}
            <Card className="mb-4 min-h-[400px] max-h-[60vh] overflow-y-auto">
              <CardContent className="p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary/40" />
                    <h3 className="text-lg font-semibold mb-2">InveStar Agent — Cross-Border Finance 🤖</h3>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto text-sm">
                      Your AI advisor for cross-border payments, international investment, FX strategy, and Japan–US corridor transactions.
                    </p>
                    <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mb-6">
                      {[
                        { icon: "💸", title: "Payments", desc: "Compare routing, fees & speed" },
                        { icon: "📈", title: "Investing", desc: "Cross-border tax & structures" },
                        { icon: "🔄", title: "FX & Compliance", desc: "Hedging & regulatory guidance" },
                      ].map(c => (
                        <div key={c.title} className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
                          <p className="text-2xl mb-1">{c.icon}</p>
                          <p className="text-xs font-semibold text-foreground">{c.title}</p>
                          <p className="text-[10px] text-muted-foreground">{c.desc}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4 justify-center">
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">🔍 Web Search</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">💸 Payments</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">📊 Portfolio</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">🔄 FX Strategy</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">🛡 Compliance</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">🪁 Startup/VC</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 lg:hidden">
                      {QUICK_PROMPTS.slice(0, 4).map(q => (
                        <Button key={q.label} variant="outline" size="sm" onClick={() => sendMessage(q.prompt)} className="text-xs">
                          {q.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-[10px] font-bold text-white">IA</span>
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/50 border border-border"}`}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-[10px] font-medium text-muted-foreground">You</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Tool Steps */}
                {isLoading && toolSteps.length > 0 && (
                  <div className="flex justify-start gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-[10px] font-bold text-white">IA</span>
                    </div>
                    <div className="max-w-[80%] space-y-2">
                      {toolSteps.map((step, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
                          {step.status === "calling" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                          ) : (
                            TOOL_ICONS[step.tool] || <Search className="w-3.5 h-3.5 text-accent" />
                          )}
                          <span className={step.status === "done" ? "text-muted-foreground" : "text-foreground"}>
                            {TOOL_LABELS[step.tool] || step.tool}
                            {step.tool === "web_search" && step.args?.query && (
                              <span className="text-muted-foreground ml-1">"{step.args.query}"</span>
                            )}
                            {step.tool === "scrape_url" && step.args?.url && (
                              <span className="text-muted-foreground ml-1 truncate max-w-[200px] inline-block align-bottom">{step.args.url}</span>
                            )}
                          </span>
                          {step.status === "done" && <span className="text-accent">✓</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isLoading && messages[messages.length - 1]?.role !== "assistant" && toolSteps.length === 0 && (
                  <div className="flex justify-start gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-white">IA</span>
                    </div>
                    <div className="bg-muted/50 border border-border rounded-xl px-4 py-3 flex gap-1">
                      {[0, 0.2, 0.4].map((delay, i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: `${delay}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>
            </Card>

            {/* Voice waveform */}
            {isElevenLabsSpeaking && (
              <div className="flex items-center justify-center gap-2 mb-2">
                <VoiceWaveform isActive={isElevenLabsSpeaking} barCount={7} className="h-5" />
                <span className="text-xs text-primary animate-pulse">AI Coach is speaking...</span>
                <Button variant="destructive" size="sm" onClick={stopSpeaking} className="h-6 px-2 text-xs">
                  <StopCircle className="w-3 h-3 mr-1" /> Stop
                </Button>
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              {voiceSupported && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isListening ? "destructive" : "outline"}
                      size="icon"
                      className={`h-10 w-10 flex-shrink-0 ${isListening ? "animate-pulse" : ""}`}
                      onClick={isListening ? stopListening : startListening}
                      disabled={isLoading}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isListening ? "Stop listening" : "Voice input"}</TooltipContent>
                </Tooltip>
              )}
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                placeholder={isListening ? "Listening..." : currentPlaceholder}
                disabled={isLoading || isListening}
                className="flex-1"
              />
              <Button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()} className="gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={autoSpeak ? "default" : "outline"}
                    size="icon"
                    className="h-10 w-10 flex-shrink-0"
                    onClick={() => setAutoSpeak(!autoSpeak)}
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{autoSpeak ? "Auto-speak on" : "Auto-speak off"}</TooltipContent>
              </Tooltip>
            </div>

            <p className="text-[10px] text-muted-foreground text-center mt-2 font-mono">
              InveStar Agent · Powered by Gemini · Information only — not financial advice
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer Modal */}
      <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-500 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Important Disclaimer
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2 text-sm">
              <p>
                InveStar Agent is an AI-powered information tool designed to help you understand
                cross-border payments, investment concepts, foreign exchange, and compliance frameworks.
              </p>
              <p>
                <strong className="text-foreground">This tool does not:</strong> execute transactions,
                manage funds, provide regulated financial advice, or constitute a solicitation to
                buy or sell any financial product.
              </p>
              <p>
                FX rates shown are indicative only. All investment involves risk, including loss
                of principal. Always verify information with a licensed financial advisor,
                tax professional, or legal counsel before making decisions.
              </p>
            </DialogDescription>
          </DialogHeader>
          <Button variant="outline" onClick={() => setShowDisclaimer(false)}>I understand</Button>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default InveStarAI;
