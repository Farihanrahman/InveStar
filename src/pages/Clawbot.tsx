import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Bot, TrendingUp, MessageSquare, ArrowUpRight, DollarSign, BarChart3, Shield, Zap, RefreshCw, Send, CheckCircle2, XCircle, ArrowRight, Settings, Search, Cpu, Mic, MicOff, Volume2, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import TradingAgents from "@/components/TradingAgents";
import { useConfetti } from "@/hooks/useConfetti";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import VoiceWaveform from "@/components/VoiceWaveform";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AlpacaAccount {
  equity: string; cash: string; portfolio_value: string;
  buying_power: string; unrealized_pl: string; unrealized_plpc: string;
}

interface AlpacaPosition {
  symbol: string; qty: string; avg_entry_price: string; current_price: string;
  market_value: string; unrealized_pl: string; unrealized_plpc: string;
}

interface AlpacaOrder {
  id: string; symbol: string; qty: string; notional: string | null;
  side: string; type: string; status: string; filled_avg_price: string | null;
  created_at: string;
}

interface ActionResult {
  tool: string;
  args: Record<string, unknown>;
  result: { success?: boolean; message?: string; demo?: boolean; details?: Record<string, unknown> };
}

interface Message {
  role: "user" | "assistant";
  content: string;
  actions?: ActionResult[];
}

interface AgentSettings {
  investingStyle: string;
  riskLevel: string;
  timeHorizon: string;
  stockPct: number;
  reitPct: number;
  bondPct: number;
  dcaEnabled: boolean;
  dcaAmount: number;
  dcaFrequency: string;
  maxPositionPct: number;
  buyOnDip: boolean;
  dividendFocus: boolean;
  esgFilter: boolean;
}

const DEFAULT_SETTINGS: AgentSettings = {
  investingStyle: "growth",
  riskLevel: "moderate-high",
  timeHorizon: "10+ years",
  stockPct: 65,
  reitPct: 25,
  bondPct: 10,
  dcaEnabled: true,
  dcaAmount: 500,
  dcaFrequency: "monthly",
  maxPositionPct: 15,
  buyOnDip: true,
  dividendFocus: false,
  esgFilter: false,
};

const STOCKS = ["VTI", "SPY", "QQQ", "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK.B", "JPM", "JNJ"];
const REITS = ["VNQ", "O", "AMT", "PLD", "SPG", "WELL", "DLR", "AVB", "EQR", "PSA"];
const BONDS = ["BND", "AGG", "TLT", "IEF", "SHY", "TIPS", "LQD", "HYG"];

const QUICK_CHIPS = [
  "Buy $500 of NVDA",
  "Send $100 to Ahmed via bKash",
  "What's AAPL trading at?",
  "Analyze my portfolio",
  "Latest market news",
  "Send $200 to my family",
];

type AssetClass = "stock" | "reit" | "bond";

function ActionCard({ action }: { action: ActionResult }) {
  const isSuccess = action.result.success !== false;
  const isTrade = action.tool === "place_trade";
  const isSend = action.tool === "send_money";

  return (
    <div className={`mt-2 rounded-lg border p-3 ${isSuccess ? "border-green-500/30 bg-green-50 dark:bg-green-950/20" : "border-red-500/30 bg-red-50 dark:bg-red-950/20"}`}>
      <div className="flex items-center gap-2 mb-1.5">
        {isSuccess ? (
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
        )}
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {isTrade ? "Trade Executed" : isSend ? "Payment Initiated" : "Action"}
        </span>
        {action.result.demo && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">DEMO</Badge>
        )}
      </div>

      {isTrade && (
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-primary shrink-0" />
          <span className="font-semibold">BUY</span>
          <span className="text-primary font-bold">{String(action.args.symbol).toUpperCase()}</span>
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span>${Number(action.args.amount_usd).toLocaleString()}</span>
        </div>
      )}

      {isSend && (
        <div className="flex items-center gap-2 text-sm">
          <Send className="w-4 h-4 text-primary shrink-0" />
          <span className="font-semibold">${Number(action.args.amount_usd).toLocaleString()}</span>
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-primary font-bold">{String(action.args.recipient_name)}</span>
          {action.args.method && (
            <Badge variant="secondary" className="text-[10px]">{String(action.args.method)}</Badge>
          )}
        </div>
      )}

      {action.result.details && isSend && (
        <div className="mt-1.5 text-xs text-muted-foreground space-y-0.5">
          <div>Rate: 1 USD = ৳{Number((action.result.details as Record<string, unknown>).exchange_rate).toFixed(2)}</div>
          <div>Receiver gets: ৳{Number((action.result.details as Record<string, unknown>).amount_bdt).toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}

function EquityChart({ equity }: { equity: number }) {
  const data = useMemo(() => {
    const BASE = 1000000;
    const days = 30;
    const points = [];
    const diff = equity - BASE;
    for (let i = 0; i <= days; i++) {
      const progress = i / days;
      const noise = (Math.sin(i * 1.2) * 0.02 + Math.cos(i * 0.7) * 0.015) * BASE;
      const value = BASE + diff * (progress ** 0.8) + noise * progress;
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      points.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        equity: Math.round(value * 100) / 100,
      });
    }
    // Ensure last point matches actual equity
    points[points.length - 1].equity = equity;
    return points;
  }, [equity]);

  const minY = Math.floor(Math.min(...data.map(d => d.equity)) * 0.995);
  const maxY = Math.ceil(Math.max(...data.map(d => d.equity)) * 1.005);
  const isPositive = equity >= 1000000;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={isPositive ? "hsl(142, 76%, 45%)" : "hsl(0, 72%, 51%)"} stopOpacity={0.3} />
            <stop offset="95%" stopColor={isPositive ? "hsl(142, 76%, 45%)" : "hsl(0, 72%, 51%)"} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 20%)" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(215, 10%, 60%)" }} tickLine={false} axisLine={false} interval={6} />
        <YAxis domain={[minY, maxY]} tick={{ fontSize: 11, fill: "hsl(215, 10%, 60%)" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(2)}M` : `$${(v / 1000).toFixed(0)}k`} width={65} />
        <Tooltip
          contentStyle={{ background: "hsl(215, 25%, 12%)", border: "1px solid hsl(215, 20%, 20%)", borderRadius: 8, fontSize: 13 }}
          labelStyle={{ color: "hsl(215, 10%, 60%)" }}
          formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "Equity"]}
        />
        <Area type="monotone" dataKey="equity" stroke={isPositive ? "hsl(142, 76%, 45%)" : "hsl(0, 72%, 51%)"} strokeWidth={2} fill="url(#equityGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const PIE_COLORS = [
  "hsl(200, 100%, 50%)", "hsl(142, 76%, 45%)", "hsl(280, 65%, 60%)",
  "hsl(25, 95%, 53%)", "hsl(340, 82%, 52%)", "hsl(180, 70%, 45%)",
  "hsl(45, 93%, 47%)", "hsl(217, 91%, 60%)", "hsl(330, 70%, 50%)", "hsl(160, 60%, 40%)",
];

function AllocationPieChart({ positions, cash }: { positions: AlpacaPosition[]; cash: number }) {
  const data = useMemo(() => {
    const items = positions.map((p, i) => ({
      name: p.symbol,
      value: Math.max(0, Number(p.market_value)),
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
    if (cash > 0) items.push({ name: "Cash", value: cash, color: "hsl(215, 20%, 55%)" });
    return items.filter(d => d.value > 0);
  }, [positions, cash]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No holdings to display</p>;

  return (
    <div className="flex flex-col lg:flex-row items-center gap-4">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value" labelLine={false}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="hsl(var(--background))" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "hsl(215, 25%, 12%)", border: "1px solid hsl(215, 20%, 20%)", borderRadius: 8, fontSize: 13 }}
            formatter={(value: number, name: string) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2 justify-center lg:flex-col lg:gap-1">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="font-medium">{d.name}</span>
            <span className="text-muted-foreground">{total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Clawbot() {
  const [tab, setTab] = useState("advisor");
  const [account, setAccount] = useState<AlpacaAccount | null>(null);
  const [positions, setPositions] = useState<AlpacaPosition[]>([]);
  const [orders, setOrders] = useState<AlpacaOrder[]>([]);
  const [isDemo, setIsDemo] = useState<boolean>(() => {
    try { return localStorage.getItem("investar-demo-reset") === "true" || true; } catch { return true; }
  });
  const [demoReset, setDemoReset] = useState(() => {
    try { return localStorage.getItem("investar-demo-reset") === "true"; } catch { return false; }
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { triggerConfetti } = useConfetti();

  // Invest state
  const [assetClass, setAssetClass] = useState<AssetClass>("stock");
  const [symbol, setSymbol] = useState("VTI");
  const [amount, setAmount] = useState("1000");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [investing, setInvesting] = useState(false);
  const [orderResult, setOrderResult] = useState<{ success: boolean; message: string } | null>(null);
  const [aiOpinion, setAiOpinion] = useState("");
  const [aiOpinionLoading, setAiOpinionLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<AgentSettings>(() => {
    try {
      const saved = localStorage.getItem("investar-agent-settings");
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });

  const updateSetting = <K extends keyof AgentSettings>(key: K, value: AgentSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      // Auto-adjust allocation to 100%
      if (key === "stockPct" || key === "reitPct" || key === "bondPct") {
        const total = next.stockPct + next.reitPct + next.bondPct;
        if (total !== 100) {
          // Adjust the last-changed field
          if (key === "stockPct") next.bondPct = Math.max(0, 100 - next.stockPct - next.reitPct);
          else if (key === "reitPct") next.bondPct = Math.max(0, 100 - next.stockPct - next.reitPct);
          else next.reitPct = Math.max(0, 100 - next.stockPct - next.bondPct);
        }
      }
      localStorage.setItem("investar-agent-settings", JSON.stringify(next));
      return next;
    });
  };

  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm the **InveStar Agent** — your autonomous AI coach for investing and payments. I can **execute trades**, **send money**, and **search the web** for real-time market data.\n\nTry saying:\n- \"Buy $500 of NVDA\"\n- \"What's AAPL trading at?\"\n- \"Latest market news\"\n\n🤖📈💸" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const lastAgentMsgRef = useRef<string>("");

  const handleAgentVoiceTranscript = useCallback((text: string) => {
    setChatInput(text);
    setAutoSpeak(true);
    setTimeout(() => sendChat(text), 100);
  }, []);

  const {
    isListening: agentListening,
    isSpeaking: agentVoiceSpeaking,
    isSupported: agentVoiceSupported,
    startListening: agentStartListening,
    stopListening: agentStopListening,
    stopSpeaking: agentStopVoiceSpeaking,
  } = useVoiceChat({ onTranscript: handleAgentVoiceTranscript });

  const {
    speak: agentSpeak,
    stopSpeaking: agentStopTTS,
    isSpeaking: agentTTSSpeaking,
  } = useElevenLabsTTS({ voiceId: "EXAVITQu4vr4xnSDxMaL" });

  const agentIsSpeaking = agentVoiceSpeaking || agentTTSSpeaking;
  const agentStopAllSpeaking = () => { agentStopVoiceSpeaking(); agentStopTTS(); };

  useEffect(() => {
    if (agentListening && agentTTSSpeaking) agentStopTTS();
  }, [agentListening, agentTTSSpeaking, agentStopTTS]);

  const tickers = assetClass === "reit" ? REITS : assetClass === "bond" ? BONDS : STOCKS;

  const fetchPortfolio = useCallback(async () => {
    // If user explicitly reset, stay in demo mode with $10K
    if (demoReset) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("clawbot-portfolio");
      if (error) throw error;
      setAccount(data.account);
      setPositions(data.positions || []);
      setOrders(data.orders || []);
      setIsDemo(!!data.demo);
    } catch (e) {
      console.error("Portfolio fetch error:", e);
      toast({ title: "Error", description: "Failed to load portfolio data", variant: "destructive" });
    }
    setLoading(false);
  }, [toast, demoReset]);

  useEffect(() => { fetchPortfolio(); }, [fetchPortfolio]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Chat send with tool-calling support
  async function sendChat(text?: string) {
    const msg = (text || chatInput).trim();
    if (!msg || chatLoading) return;
    setChatInput("");
    setShowChips(false);
    const newMessages: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setChatLoading(true);
    let accumulated = "";

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/clawbot-advisor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          messages: newMessages
            .filter(m => m !== newMessages[0])
            .map(m => ({ role: m.role, content: m.content })),
          demo: isDemo,
          settings,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let actions: ActionResult[] = [];
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6);
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            if (parsed.type === "actions") {
              actions = parsed.actions;
              if (actions.some(a => a.tool === "place_trade" && a.result.success)) {
                triggerConfetti("buy");
                toast({ title: "🎉 Trade Executed!", description: "Your trade was successfully placed!" });
                // Add local trades to positions/orders for immediate UI feedback
                actions.filter(a => a.tool === "place_trade" && a.result.success).forEach(a => {
                  const sym = String(a.args.symbol).toUpperCase();
                  const amt = Number(a.args.amount_usd);
                  const price = (a.result.details as Record<string, unknown>)?.filled_avg_price
                    ? Number((a.result.details as Record<string, unknown>).filled_avg_price)
                    : amt / 10; // fallback estimate
                  const qty = price > 0 ? amt / price : 0;

                  setPositions(prev => {
                    const existing = prev.find(p => p.symbol === sym);
                    if (existing) {
                      const oldQty = Number(existing.qty);
                      const newQty = oldQty + qty;
                      const newAvg = ((Number(existing.avg_entry_price) * oldQty) + (price * qty)) / newQty;
                      return prev.map(p => p.symbol === sym ? {
                        ...p,
                        qty: String(newQty),
                        avg_entry_price: String(newAvg),
                        current_price: String(price),
                        market_value: String(newQty * price),
                        unrealized_pl: String((price - newAvg) * newQty),
                        unrealized_plpc: String(newAvg > 0 ? (price - newAvg) / newAvg : 0),
                      } : p);
                    }
                    return [...prev, {
                      symbol: sym, qty: String(qty), avg_entry_price: String(price),
                      current_price: String(price), market_value: String(amt),
                      unrealized_pl: "0", unrealized_plpc: "0",
                    }];
                  });

                  setOrders(prev => [{
                    id: `local-${Date.now()}`, symbol: sym, qty: String(qty),
                    notional: String(amt), side: "buy", type: "market", status: "filled",
                    filled_avg_price: String(price), created_at: new Date().toISOString(),
                  }, ...prev]);

                  // Update account equity
                  setAccount(prev => {
                    const eq = prev ? Number(prev.equity) : DEMO_EQUITY;
                    const c = prev ? Number(prev.cash) : DEMO_EQUITY;
                    const pv = prev ? Number(prev.portfolio_value) : 0;
                    return {
                      equity: String(eq),
                      cash: String(c - amt),
                      portfolio_value: String(pv + amt),
                      buying_power: String((c - amt) * 2),
                      unrealized_pl: prev?.unrealized_pl || "0",
                      unrealized_plpc: prev?.unrealized_plpc || "0",
                    };
                  });
                });
              }
              if (actions.some(a => a.tool === "send_money" && a.result.success)) {
                triggerConfetti("buy");
                toast({ title: "🎉 Payment Sent!", description: "Your money transfer was successful!" });
              }
              continue;
            }
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: accumulated, actions };
                return updated;
              });
            }
          } catch { }
        }
      }

      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = {
          ...last,
          content: accumulated || "I've processed your request.",
          actions: actions.length > 0 ? actions : undefined,
        };
        return updated;
      });

      if (!accumulated && actions.length === 0) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: "Sorry, I couldn't process that." };
          return updated;
        });
      }
    } catch (e) {
      console.error("Agent error:", e);
      setMessages(prev => [...prev, { role: "assistant", content: "Network error — please try again." }]);
    }
    setChatLoading(false);
    // Auto-speak
    if (autoSpeak && accumulated && accumulated !== lastAgentMsgRef.current) {
      lastAgentMsgRef.current = accumulated;
      const clean = accumulated.replace(/[#*_`]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      agentSpeak(clean);
    }
  }

  // Get AI opinion for invest
  async function getAIOpinion() {
    setAiOpinionLoading(true);
    setAiOpinion("");
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/clawbot-advisor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `I'm about to buy $${amount} of ${symbol} as a ${orderType} order. Search for the current price and recent news, then give me a concise CFA-level assessment: is this a good idea right now? Key risks and opportunities? 3-4 sentences max.`
          }],
          demo: isDemo,
          settings,
        }),
      });

      if (!response.ok) throw new Error("AI request failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6);
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) { acc += c; setAiOpinion(acc); }
          } catch { }
        }
      }
    } catch {
      setAiOpinion("Could not fetch AI opinion.");
    }
    setAiOpinionLoading(false);
  }

  // Place order
  async function placeOrder() {
    if (!amount || Number(amount) < 1) return;
    setInvesting(true);
    setOrderResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("clawbot-invest", {
        body: {
          symbol, notional: Number(amount), type: orderType,
          limitPrice: limitPrice ? Number(limitPrice) : undefined,
          aiRationale: aiOpinion, demo: isDemo,
        },
      });
      if (error) throw error;
      setOrderResult(data);
      if (data.success) {
        triggerConfetti("buy");
        toast({ title: "🎉 Order Placed!", description: data.message });
        const amt = Number(amount);
        const price = data.filled_avg_price ? Number(data.filled_avg_price) : amt / 10;
        const qty = price > 0 ? amt / price : 0;

        setPositions(prev => {
          const existing = prev.find(p => p.symbol === symbol);
          if (existing) {
            const oldQty = Number(existing.qty);
            const newQty = oldQty + qty;
            const newAvg = ((Number(existing.avg_entry_price) * oldQty) + (price * qty)) / newQty;
            return prev.map(p => p.symbol === symbol ? {
              ...p, qty: String(newQty), avg_entry_price: String(newAvg),
              current_price: String(price), market_value: String(newQty * price),
              unrealized_pl: String((price - newAvg) * newQty),
              unrealized_plpc: String(newAvg > 0 ? (price - newAvg) / newAvg : 0),
            } : p);
          }
          return [...prev, {
            symbol, qty: String(qty), avg_entry_price: String(price),
            current_price: String(price), market_value: String(amt),
            unrealized_pl: "0", unrealized_plpc: "0",
          }];
        });

        setOrders(prev => [{
          id: `local-${Date.now()}`, symbol, qty: String(qty),
          notional: String(amt), side: "buy", type: orderType, status: "filled",
          filled_avg_price: String(price), created_at: new Date().toISOString(),
        }, ...prev]);

        setAccount(prev => {
          const eq = prev ? Number(prev.equity) : DEMO_EQUITY;
          const c = prev ? Number(prev.cash) : DEMO_EQUITY;
          const pv = prev ? Number(prev.portfolio_value) : 0;
          return {
            equity: String(eq), cash: String(c - amt),
            portfolio_value: String(pv + amt), buying_power: String((c - amt) * 2),
            unrealized_pl: prev?.unrealized_pl || "0", unrealized_plpc: prev?.unrealized_plpc || "0",
          };
        });
      }
    } catch {
      setOrderResult({ success: false, message: "Network error. Please try again." });
    }
    setInvesting(false);
  }

  const DEMO_EQUITY = 1000000;
  const equity = account ? Number(account.equity) : DEMO_EQUITY;
  const cash = account ? Number(account.cash) : DEMO_EQUITY;
  const portfolioValue = account ? Number(account.portfolio_value) : 0;
  const unrealizedPl = account ? Number(account.unrealized_pl) : 0;
  const plPct = account ? (Number(account.unrealized_plpc) * 100) : 0;

  function resetDashboard() {
    setAccount(null);
    setPositions([]);
    setOrders([]);
    setIsDemo(true);
    setDemoReset(true);
    localStorage.setItem("investar-demo-reset", "true");
    toast({ title: "Dashboard Reset", description: "Portfolio reset to $1,000,000 demo balance." });
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">InveStar Agent</h1>
              <p className="text-sm text-muted-foreground">Autonomous Investment & Payments AI Coach</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDemo && (
              <Badge variant="outline" className="border-amber-500/50 text-amber-600 bg-amber-50 dark:bg-amber-950/20">
                <Zap className="w-3 h-3 mr-1" /> Demo Mode
              </Badge>
            )}
            {!isDemo && (
              <Badge variant="outline" className="border-green-500/50 text-green-600 bg-green-50 dark:bg-green-950/20">
                <Shield className="w-3 h-3 mr-1" /> Paper Trading
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={fetchPortfolio} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-[650px]">
            <TabsTrigger value="advisor"><MessageSquare className="w-4 h-4 mr-1" />Agent</TabsTrigger>
            <TabsTrigger value="agents"><Cpu className="w-4 h-4 mr-1" />Agents</TabsTrigger>
            <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 mr-1" />Dashboard</TabsTrigger>
            <TabsTrigger value="invest"><TrendingUp className="w-4 h-4 mr-1" />Invest</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-1" />Settings</TabsTrigger>
          </TabsList>

          {/* ─── DASHBOARD TAB ────────────────────────────── */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="flex justify-end mb-2">
              <Button variant="outline" size="sm" onClick={resetDashboard} className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10">
                <RefreshCw className="w-3.5 h-3.5" /> Reset Portfolio
              </Button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground font-medium">Total Equity</p>
                  <p className="text-xl font-bold text-foreground">${equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground font-medium">Cash Available</p>
                  <p className="text-xl font-bold text-foreground">${cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground font-medium">Portfolio Value</p>
                  <p className="text-xl font-bold text-foreground">${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground font-medium">Unrealized P&L</p>
                  <p className={`text-xl font-bold ${unrealizedPl >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {unrealizedPl >= 0 ? "+" : ""}${unrealizedPl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    <span className="text-sm ml-1">({plPct >= 0 ? "+" : ""}{plPct.toFixed(1)}%)</span>
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Equity Performance Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Equity Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EquityChart equity={equity} />
              </CardContent>
            </Card>

            {/* Allocation Pie Chart */}
            {positions.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Portfolio Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AllocationPieChart positions={positions} cash={cash} />
                </CardContent>
              </Card>
            )}

            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Positions ({positions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                  {positions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No positions yet. Start investing!</p>
                  ) : positions.map((p) => (
                    <div key={p.symbol} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                      <div>
                        <p className="font-semibold text-sm">{p.symbol}</p>
                        <p className="text-xs text-muted-foreground">{p.qty} shares @ ${Number(p.avg_entry_price).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">${Number(p.market_value).toLocaleString()}</p>
                        <p className={`text-xs ${Number(p.unrealized_pl) >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {Number(p.unrealized_pl) >= 0 ? "+" : ""}${Number(p.unrealized_pl).toFixed(2)}
                          ({(Number(p.unrealized_plpc) * 100).toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4" /> Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                  {orders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No orders yet.</p>
                  ) : orders.slice(0, 10).map((o) => (
                    <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-semibold text-sm">{o.side.toUpperCase()} {o.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          {o.type} • {new Date(o.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={o.status === "filled" ? "default" : o.status === "pending_new" ? "secondary" : "outline"} className="text-xs">
                          {o.status}
                        </Badge>
                        {o.filled_avg_price && (
                          <p className="text-xs text-muted-foreground mt-1">@ ${Number(o.filled_avg_price).toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── INVEST TAB ────────────────────────────── */}
          <TabsContent value="invest" className="space-y-4">
            <div className="grid lg:grid-cols-5 gap-4">
              <Card className="lg:col-span-3">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Place Buy Order
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">InveStar Agent only executes buy orders. Sells require manual authorization.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    {(["stock", "reit", "bond"] as AssetClass[]).map(cls => (
                      <Button
                        key={cls}
                        variant={assetClass === cls ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setAssetClass(cls);
                          setSymbol(cls === "reit" ? "VNQ" : cls === "bond" ? "BND" : "VTI");
                          setOrderResult(null);
                          setAiOpinion("");
                        }}
                      >
                        {cls === "reit" ? "Real Estate" : cls === "bond" ? "Bonds" : "Stocks / ETFs"}
                      </Button>
                    ))}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground font-medium mb-1 block">Ticker</label>
                      <Select value={symbol} onValueChange={setSymbol}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {tickers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground font-medium mb-1 block">Amount (USD)</label>
                      <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="1" placeholder="1000" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground font-medium mb-1 block">Order Type</label>
                      <Select value={orderType} onValueChange={(v: "market" | "limit") => setOrderType(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="market">Market (immediate)</SelectItem>
                          <SelectItem value="limit">Limit (set price)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {orderType === "limit" && (
                      <div>
                        <label className="text-xs text-muted-foreground font-medium mb-1 block">Limit Price ($)</label>
                        <Input type="number" value={limitPrice} onChange={e => setLimitPrice(e.target.value)} placeholder="245.00" />
                      </div>
                    )}
                  </div>

                  {aiOpinion && (
                    <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                      <p className="text-xs font-medium text-primary mb-1">🤖 InveStar Analysis</p>
                      <p className="text-sm text-foreground leading-relaxed">{aiOpinion}</p>
                    </div>
                  )}

                  {orderResult && (
                    <div className={`p-3 rounded-lg border ${orderResult.success ? "border-green-500/30 bg-green-50 dark:bg-green-950/20" : "border-red-500/30 bg-red-50 dark:bg-red-950/20"}`}>
                      <p className={`text-sm ${orderResult.success ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                        {orderResult.message}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={getAIOpinion} disabled={aiOpinionLoading} className="flex-1">
                      <Bot className="w-4 h-4 mr-1" />
                      {aiOpinionLoading ? "Analyzing..." : "Get AI Opinion"}
                    </Button>
                    <Button onClick={placeOrder} disabled={investing || !amount || Number(amount) < 1} className="flex-1">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {investing ? "Placing..." : `Buy ${symbol}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Portfolio Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Equity</span>
                    <span className="font-medium">${equity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cash</span>
                    <span className="font-medium">${cash.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Positions</span>
                    <span className="font-medium">{positions.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">P&L</span>
                    <span className={`font-medium ${unrealizedPl >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {unrealizedPl >= 0 ? "+" : ""}${unrealizedPl.toLocaleString()}
                    </span>
                  </div>
                  <hr className="border-border" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Top Holdings</p>
                    {positions.slice(0, 5).map(p => (
                      <div key={p.symbol} className="flex justify-between text-xs">
                        <span>{p.symbol}</span>
                        <span>${Number(p.market_value).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <hr className="border-border" />
                  <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      <Shield className="w-3 h-3 inline mr-1" />
                      Buy-only mode • Max {settings.maxPositionPct}% per position • No withdrawals
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── AGENT CHAT TAB ────────────────────────────── */}
          <TabsContent value="advisor">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" /> InveStar Agent
                  {isDemo && <Badge variant="outline" className="text-xs">Demo</Badge>}
                  <Badge variant="secondary" className="text-xs ml-auto">
                    <Search className="w-3 h-3 mr-1" />Web Search
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />Trades & Payments
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages */}
                <div className="h-[500px] overflow-y-auto px-4 py-3 space-y-3">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[85%]">
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        }`}>
                          {m.role === "assistant" ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown>{m.content}</ReactMarkdown>
                            </div>
                          ) : m.content}
                        </div>
                        {m.actions?.map((action, idx) => (
                          <ActionCard key={idx} action={action} />
                        ))}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted text-muted-foreground px-4 py-2.5 rounded-2xl rounded-bl-md text-sm italic flex items-center gap-2">
                        <Bot className="w-4 h-4 animate-pulse" />
                        Searching & thinking...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick chips */}
                {showChips && (
                  <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                    {QUICK_CHIPS.map(c => (
                      <button
                        key={c}
                        onClick={() => sendChat(c)}
                        className="px-3 py-1.5 rounded-full text-xs border border-border hover:bg-muted transition-colors text-muted-foreground"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}

                {/* Voice waveform */}
                {agentTTSSpeaking && (
                  <div className="px-3 py-1.5 border-t border-border flex items-center gap-2">
                    <VoiceWaveform isActive={agentTTSSpeaking} barCount={5} className="h-4" />
                    <span className="text-xs text-primary animate-pulse">Speaking...</span>
                    <Button variant="destructive" size="sm" onClick={agentStopAllSpeaking} className="h-5 px-2 text-[10px] ml-auto">
                      <StopCircle className="w-3 h-3 mr-0.5" /> Stop
                    </Button>
                  </div>
                )}

                {/* Input */}
                <div className="p-3 border-t border-border flex gap-2">
                  {agentVoiceSupported && (
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={agentListening ? "destructive" : "outline"}
                          size="icon"
                          className={`h-10 w-10 flex-shrink-0 ${agentListening ? "animate-pulse" : ""}`}
                          onClick={agentListening ? agentStopListening : agentStartListening}
                          disabled={chatLoading}
                        >
                          {agentListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{agentListening ? "Stop listening" : "Voice input"}</TooltipContent>
                    </UITooltip>
                  )}
                  <Input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendChat()}
                    placeholder={agentListening ? "Listening..." : "Buy $500 of AAPL, What's NVDA at?, or ask anything..."}
                    disabled={chatLoading || agentListening}
                    className="flex-1"
                  />
                  <Button onClick={() => sendChat()} disabled={chatLoading || !chatInput.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                  <UITooltip>
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
                  </UITooltip>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── SETTINGS TAB ────────────────────────────── */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Investing Profile */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Investing Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Investing Style</label>
                    <Select value={settings.investingStyle} onValueChange={v => updateSetting("investingStyle", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conservative">Conservative</SelectItem>
                        <SelectItem value="value">Value Investing</SelectItem>
                        <SelectItem value="growth">Growth</SelectItem>
                        <SelectItem value="aggressive-growth">Aggressive Growth</SelectItem>
                        <SelectItem value="income">Income / Dividends</SelectItem>
                        <SelectItem value="index">Index / Passive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Risk Tolerance</label>
                    <Select value={settings.riskLevel} onValueChange={v => updateSetting("riskLevel", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low — Capital preservation</SelectItem>
                        <SelectItem value="moderate">Moderate — Balanced</SelectItem>
                        <SelectItem value="moderate-high">Moderate-High — Growth focused</SelectItem>
                        <SelectItem value="high">High — Maximum growth</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Time Horizon</label>
                    <Select value={settings.timeHorizon} onValueChange={v => updateSetting("timeHorizon", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-3 years">1–3 years</SelectItem>
                        <SelectItem value="3-5 years">3–5 years</SelectItem>
                        <SelectItem value="5-10 years">5–10 years</SelectItem>
                        <SelectItem value="10+ years">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-2 block">
                      Max Position Size: {settings.maxPositionPct}%
                    </label>
                    <Slider
                      value={[settings.maxPositionPct]}
                      onValueChange={([v]) => updateSetting("maxPositionPct", v)}
                      min={5}
                      max={30}
                      step={1}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Safety guardrail — no single asset exceeds this % of portfolio</p>
                  </div>
                </CardContent>
              </Card>

              {/* Allocation Targets */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Allocation Targets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-2 block">
                      Stocks / ETFs: {settings.stockPct}%
                    </label>
                    <Slider
                      value={[settings.stockPct]}
                      onValueChange={([v]) => updateSetting("stockPct", v)}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-2 block">
                      REITs: {settings.reitPct}%
                    </label>
                    <Slider
                      value={[settings.reitPct]}
                      onValueChange={([v]) => updateSetting("reitPct", v)}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground font-medium mb-2 block">
                      Bonds: {settings.bondPct}%
                    </label>
                    <Slider
                      value={[settings.bondPct]}
                      onValueChange={([v]) => updateSetting("bondPct", v)}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">Total Allocation</p>
                    <p className={`text-lg font-bold ${settings.stockPct + settings.reitPct + settings.bondPct === 100 ? "text-green-600" : "text-amber-600"}`}>
                      {settings.stockPct + settings.reitPct + settings.bondPct}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* DCA Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Dollar-Cost Averaging (DCA)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Enable Auto-Invest DCA</p>
                      <p className="text-xs text-muted-foreground">Automatically invest on schedule</p>
                    </div>
                    <Switch
                      checked={settings.dcaEnabled}
                      onCheckedChange={v => updateSetting("dcaEnabled", v)}
                    />
                  </div>

                  {settings.dcaEnabled && (
                    <>
                      <div>
                        <label className="text-xs text-muted-foreground font-medium mb-1 block">Amount per period (USD)</label>
                        <Input
                          type="number"
                          value={settings.dcaAmount}
                          onChange={e => updateSetting("dcaAmount", Number(e.target.value))}
                          min={50}
                          step={50}
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground font-medium mb-1 block">Frequency</label>
                        <Select value={settings.dcaFrequency} onValueChange={v => updateSetting("dcaFrequency", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="biweekly">Bi-weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Preferences */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Buy on Dip</p>
                      <p className="text-xs text-muted-foreground">Agent buys more when prices drop 5%+</p>
                    </div>
                    <Switch
                      checked={settings.buyOnDip}
                      onCheckedChange={v => updateSetting("buyOnDip", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Dividend Focus</p>
                      <p className="text-xs text-muted-foreground">Prioritize dividend-paying stocks</p>
                    </div>
                    <Switch
                      checked={settings.dividendFocus}
                      onCheckedChange={v => updateSetting("dividendFocus", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">ESG Filter</p>
                      <p className="text-xs text-muted-foreground">Exclude non-ESG companies</p>
                    </div>
                    <Switch
                      checked={settings.esgFilter}
                      onCheckedChange={v => updateSetting("esgFilter", v)}
                    />
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSettings(DEFAULT_SETTINGS);
                        localStorage.setItem("investar-agent-settings", JSON.stringify(DEFAULT_SETTINGS));
                        toast({ title: "Settings Reset", description: "All preferences restored to defaults." });
                      }}
                    >
                      Reset to Defaults
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── AGENTS TAB ────────────────────────────── */}
          <TabsContent value="agents">
            <TradingAgents />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
