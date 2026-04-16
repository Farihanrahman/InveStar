import { useState, useEffect, useCallback, useMemo } from "react";
import { Bot, Play, Square, Plus, TrendingUp, TrendingDown, Target, BarChart3, Zap, Clock, DollarSign, Settings2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

// ─── Types ──────────────────────────────────────────
interface AgentConfig {
  id: string;
  name: string;
  strategy: "rebalancer" | "custom_target";
  status: "running" | "stopped" | "completed";
  createdAt: string;
  // Rebalancer config
  stockPct?: number;
  reitPct?: number;
  bondPct?: number;
  // Custom target config
  targetEquity?: number;
  takeProfit?: number;
  stopLoss?: number;
  // Common
  startingCapital: number;
  currentEquity: number;
  maxPositionPct: number;
  tradeFrequency: string;
  // Simulated trades
  trades: SimulatedTrade[];
  positions: SimulatedPosition[];
  equityHistory: { date: string; equity: number }[];
}

interface SimulatedTrade {
  id: string;
  time: string;
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  price: number;
  value: number;
  pnl?: number;
  fee: number;
}

interface SimulatedPosition {
  symbol: string;
  side: "LONG";
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  returnPct: number;
  category: "stock" | "reit" | "bond";
}

// ─── Constants ──────────────────────────────────────
const STOCK_UNIVERSE = ["VTI", "SPY", "QQQ", "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN"];
const REIT_UNIVERSE = ["VNQ", "O", "AMT", "PLD", "SPG"];
const BOND_UNIVERSE = ["BND", "AGG", "TLT", "IEF"];

const PIE_COLORS = [
  "hsl(200, 100%, 50%)", "hsl(142, 76%, 45%)", "hsl(280, 65%, 60%)",
  "hsl(25, 95%, 53%)", "hsl(340, 82%, 52%)", "hsl(180, 70%, 45%)",
  "hsl(45, 93%, 47%)", "hsl(217, 91%, 60%)",
];

const STORAGE_KEY = "investar-trading-agents";

// ─── Simulation helpers ─────────────────────────────
function generateMockPrice(base: number): number {
  return base * (1 + (Math.random() - 0.48) * 0.03);
}

function simulateAgent(agent: AgentConfig): AgentConfig {
  const now = new Date();
  const updated = { ...agent };

  if (agent.strategy === "rebalancer") {
    // Allocate across asset classes
    const stockAlloc = (agent.stockPct || 60) / 100;
    const reitAlloc = (agent.reitPct || 25) / 100;
    const bondAlloc = (agent.bondPct || 15) / 100;

    if (agent.positions.length === 0) {
      // Initial allocation
      const positions: SimulatedPosition[] = [];
      const trades: SimulatedTrade[] = [];

      const allocate = (symbols: string[], alloc: number, cat: "stock" | "reit" | "bond") => {
        const perSymbol = (agent.startingCapital * alloc) / Math.min(symbols.length, 3);
        symbols.slice(0, 3).forEach(sym => {
          const price = sym === "VTI" ? 232 : sym === "QQQ" ? 498 : sym === "SPY" ? 530 :
            sym === "AAPL" ? 192 : sym === "NVDA" ? 875 : sym === "VNQ" ? 86 :
            sym === "O" ? 56 : sym === "BND" ? 73 : sym === "AGG" ? 101 :
            sym === "AMT" ? 210 : sym === "TLT" ? 92 : 150;
          const qty = Math.floor(perSymbol / price * 100) / 100;
          const mPrice = generateMockPrice(price);
          positions.push({
            symbol: sym, side: "LONG", size: qty, entryPrice: price,
            markPrice: mPrice, pnl: (mPrice - price) * qty,
            returnPct: ((mPrice - price) / price) * 100, category: cat,
          });
          trades.push({
            id: `t-${Date.now()}-${sym}`, time: new Date(now.getTime() - Math.random() * 86400000 * 5).toISOString(),
            symbol: sym, side: "BUY", qty, price, value: qty * price, fee: +(qty * price * 0.0004).toFixed(4),
          });
        });
      };

      allocate(STOCK_UNIVERSE, stockAlloc, "stock");
      allocate(REIT_UNIVERSE, reitAlloc, "reit");
      allocate(BOND_UNIVERSE, bondAlloc, "bond");

      updated.positions = positions;
      updated.trades = trades;
    } else {
      // Update mark prices
      updated.positions = agent.positions.map(p => {
        const mPrice = generateMockPrice(p.markPrice);
        return { ...p, markPrice: mPrice, pnl: (mPrice - p.entryPrice) * p.size, returnPct: ((mPrice - p.entryPrice) / p.entryPrice) * 100 };
      });
    }

    const totalValue = updated.positions.reduce((s, p) => s + p.markPrice * p.size, 0);
    updated.currentEquity = totalValue;
  } else {
    // Custom target strategy
    if (agent.positions.length === 0) {
      const positions: SimulatedPosition[] = [];
      const trades: SimulatedTrade[] = [];
      const symbols = [...STOCK_UNIVERSE.slice(0, 3), REIT_UNIVERSE[0]];
      const perSym = agent.startingCapital / symbols.length;
      symbols.forEach(sym => {
        const price = sym === "VTI" ? 232 : sym === "QQQ" ? 498 : sym === "SPY" ? 530 : sym === "VNQ" ? 86 : 150;
        const qty = Math.floor(perSym / price * 100) / 100;
        const mPrice = generateMockPrice(price);
        positions.push({
          symbol: sym, side: "LONG", size: qty, entryPrice: price,
          markPrice: mPrice, pnl: (mPrice - price) * qty,
          returnPct: ((mPrice - price) / price) * 100, category: "stock",
        });
        trades.push({
          id: `t-${Date.now()}-${sym}`, time: new Date(now.getTime() - Math.random() * 86400000 * 3).toISOString(),
          symbol: sym, side: "BUY", qty, price, value: qty * price, fee: +(qty * price * 0.0004).toFixed(4),
        });
      });
      updated.positions = positions;
      updated.trades = trades;
    } else {
      updated.positions = agent.positions.map(p => {
        const mPrice = generateMockPrice(p.markPrice);
        return { ...p, markPrice: mPrice, pnl: (mPrice - p.entryPrice) * p.size, returnPct: ((mPrice - p.entryPrice) / p.entryPrice) * 100 };
      });
    }

    const totalValue = updated.positions.reduce((s, p) => s + p.markPrice * p.size, 0);
    updated.currentEquity = totalValue;

    // Check if target hit
    if (agent.targetEquity && totalValue >= agent.targetEquity) {
      updated.status = "completed";
    }
    if (agent.stopLoss && totalValue <= agent.startingCapital * (1 - agent.stopLoss / 100)) {
      updated.status = "stopped";
    }
  }

  // Update equity history
  const history = [...(agent.equityHistory || [])];
  history.push({ date: now.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }), equity: updated.currentEquity });
  if (history.length > 50) history.shift();
  updated.equityHistory = history;

  return updated;
}

// ─── Sub-components ─────────────────────────────────
function AgentCard({ agent, onStart, onStop, onDelete, onExpand }: {
  agent: AgentConfig; onStart: () => void; onStop: () => void; onDelete: () => void; onExpand: () => void;
}) {
  const pnl = agent.currentEquity - agent.startingCapital;
  const pnlPct = (pnl / agent.startingCapital) * 100;
  const isPositive = pnl >= 0;

  return (
    <Card className="border-border/50 hover:border-primary/30 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${agent.status === "running" ? "bg-green-500/10" : agent.status === "completed" ? "bg-primary/10" : "bg-muted"}`}>
              <Bot className={`w-4 h-4 ${agent.status === "running" ? "text-green-500" : agent.status === "completed" ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                {agent.name}
                <Badge variant={agent.status === "running" ? "default" : agent.status === "completed" ? "secondary" : "outline"} className="text-[10px]">
                  {agent.status === "running" && <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1 animate-pulse" />}
                  {agent.status}
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {agent.strategy === "rebalancer" ? "Target Allocation" : "Custom Target"} • {agent.positions.length} positions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {agent.status === "stopped" && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500" onClick={onStart}><Play className="w-3.5 h-3.5" /></Button>
            )}
            {agent.status === "running" && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-500" onClick={onStop}><Square className="w-3.5 h-3.5" /></Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Equity</p>
            <p className="text-sm font-bold">${agent.currentEquity.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">P&L</p>
            <p className={`text-sm font-bold flex items-center gap-0.5 ${isPositive ? "text-green-500" : "text-red-500"}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? "+" : ""}${pnl.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Return</p>
            <p className={`text-sm font-bold ${isPositive ? "text-green-500" : "text-red-500"}`}>
              {isPositive ? "+" : ""}{pnlPct.toFixed(2)}%
            </p>
          </div>
        </div>

        {agent.strategy === "custom_target" && agent.targetEquity && (
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Progress to ${agent.targetEquity.toLocaleString()}</span>
              <span>{Math.min(100, ((agent.currentEquity - agent.startingCapital) / (agent.targetEquity - agent.startingCapital) * 100)).toFixed(1)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{
                width: `${Math.min(100, Math.max(0, ((agent.currentEquity - agent.startingCapital) / (agent.targetEquity - agent.startingCapital) * 100)))}%`
              }} />
            </div>
          </div>
        )}

        {agent.equityHistory.length > 3 && (
          <div className="h-[60px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={agent.equityHistory.slice(-20)} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${agent.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? "hsl(142, 76%, 45%)" : "hsl(0, 72%, 51%)"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isPositive ? "hsl(142, 76%, 45%)" : "hsl(0, 72%, 51%)"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="equity" stroke={isPositive ? "hsl(142, 76%, 45%)" : "hsl(0, 72%, 51%)"} strokeWidth={1.5} fill={`url(#grad-${agent.id})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <Button variant="ghost" size="sm" className="w-full text-xs" onClick={onExpand}>
          View Details <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

function AgentDetails({ agent }: { agent: AgentConfig }) {
  const totalValue = agent.positions.reduce((s, p) => s + p.markPrice * p.size, 0);

  const pieData = agent.positions.map((p, i) => ({
    name: p.symbol, value: p.markPrice * p.size, color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-3 pb-2">
          <p className="text-[10px] text-muted-foreground uppercase">Account Value</p>
          <p className="text-lg font-bold">${agent.currentEquity.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-2">
          <p className="text-[10px] text-muted-foreground uppercase">Starting Capital</p>
          <p className="text-lg font-bold">${agent.startingCapital.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-2">
          <p className="text-[10px] text-muted-foreground uppercase">Unrealized PnL</p>
          <p className={`text-lg font-bold ${agent.currentEquity >= agent.startingCapital ? "text-green-500" : "text-red-500"}`}>
            {agent.currentEquity >= agent.startingCapital ? "+" : ""}${(agent.currentEquity - agent.startingCapital).toFixed(2)}
          </p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-2">
          <p className="text-[10px] text-muted-foreground uppercase">Open Positions</p>
          <p className="text-lg font-bold">{agent.positions.length}</p>
        </CardContent></Card>
      </div>

      {/* Equity Chart + Allocation */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Equity Over Time</CardTitle></CardHeader>
          <CardContent>
            {agent.equityHistory.length > 2 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={agent.equityHistory} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 20%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215, 10%, 60%)" }} tickLine={false} axisLine={false} interval={Math.max(0, agent.equityHistory.length - 6)} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(215, 10%, 60%)" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`} width={50} />
                  <Tooltip contentStyle={{ background: "hsl(215, 25%, 12%)", border: "1px solid hsl(215, 20%, 20%)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`$${v.toFixed(2)}`, "Equity"]} />
                  <Area type="monotone" dataKey="equity" stroke="hsl(200, 100%, 50%)" strokeWidth={2} fill="url(#detailGrad)" />
                  <defs><linearGradient id="detailGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(200, 100%, 50%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(200, 100%, 50%)" stopOpacity={0} /></linearGradient></defs>
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground py-8 text-center">Accumulating data...</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Allocation</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="hsl(var(--background))" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(215, 25%, 12%)", border: "1px solid hsl(215, 20%, 20%)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [`$${v.toFixed(0)} (${totalValue > 0 ? ((v / totalValue) * 100).toFixed(1) : 0}%)`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="font-medium">{d.name}</span>
                    <span className="text-muted-foreground">{totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(1) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Open Positions Table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Open Positions</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium uppercase tracking-wider">Asset</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium uppercase tracking-wider">Side</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium uppercase tracking-wider">Size</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium uppercase tracking-wider">Entry</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium uppercase tracking-wider">Mark</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium uppercase tracking-wider">PnL</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium uppercase tracking-wider">Return</th>
                </tr>
              </thead>
              <tbody>
                {agent.positions.map(p => (
                  <tr key={p.symbol} className="border-b border-border/20 hover:bg-muted/30">
                    <td className="py-2 px-2 font-bold">{p.symbol}</td>
                    <td className="py-2 px-2"><Badge variant="outline" className="text-[10px] px-1.5">{p.side}</Badge></td>
                    <td className="py-2 px-2 text-right">{p.size.toFixed(4)}</td>
                    <td className="py-2 px-2 text-right">${p.entryPrice.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right">${p.markPrice.toFixed(2)}</td>
                    <td className={`py-2 px-2 text-right font-medium ${p.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {p.pnl >= 0 ? "+" : ""}${p.pnl.toFixed(2)}
                    </td>
                    <td className={`py-2 px-2 text-right ${p.returnPct >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {p.returnPct >= 0 ? "+" : ""}{p.returnPct.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Trade History */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Trade History</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium uppercase tracking-wider">Time</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium uppercase tracking-wider">Asset</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium uppercase tracking-wider">Side</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium uppercase tracking-wider">Size</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium uppercase tracking-wider">Price</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium uppercase tracking-wider">Value</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium uppercase tracking-wider">Fee</th>
                </tr>
              </thead>
              <tbody>
                {agent.trades.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).map(t => (
                  <tr key={t.id} className="border-b border-border/20 hover:bg-muted/30">
                    <td className="py-2 px-2 text-muted-foreground">{new Date(t.time).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="py-2 px-2 font-bold">{t.symbol}</td>
                    <td className="py-2 px-2">
                      <Badge variant={t.side === "BUY" ? "default" : "secondary"} className="text-[10px] px-1.5">{t.side}</Badge>
                    </td>
                    <td className="py-2 px-2 text-right">{t.qty.toFixed(4)}</td>
                    <td className="py-2 px-2 text-right">${t.price.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right">${t.value.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-muted-foreground">${t.fee.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────
export default function TradingAgents() {
  const { toast } = useToast();
  const [agents, setAgents] = useState<AgentConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // New agent form state
  const [newName, setNewName] = useState("Alpha Agent");
  const [newStrategy, setNewStrategy] = useState<"rebalancer" | "custom_target">("rebalancer");
  const [newCapital, setNewCapital] = useState("10000");
  const [newStockPct, setNewStockPct] = useState(60);
  const [newReitPct, setNewReitPct] = useState(25);
  const [newBondPct, setNewBondPct] = useState(15);
  const [newTargetEquity, setNewTargetEquity] = useState("12000");
  const [newTakeProfit, setNewTakeProfit] = useState("20");
  const [newStopLoss, setNewStopLoss] = useState("10");
  const [newMaxPosPct, setNewMaxPosPct] = useState(15);
  const [newFrequency, setNewFrequency] = useState("hourly");

  // Persist agents
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
  }, [agents]);

  // Simulation tick — update running agents every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(a => a.status === "running" ? simulateAgent(a) : a));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  function createAgent() {
    const capital = Number(newCapital);
    if (capital < 100) {
      toast({ title: "Invalid", description: "Minimum capital is $100", variant: "destructive" });
      return;
    }

    const agent: AgentConfig = {
      id: `agent-${Date.now()}`,
      name: newName || "Untitled Agent",
      strategy: newStrategy,
      status: "running",
      createdAt: new Date().toISOString(),
      startingCapital: capital,
      currentEquity: capital,
      maxPositionPct: newMaxPosPct,
      tradeFrequency: newFrequency,
      trades: [],
      positions: [],
      equityHistory: [{ date: "Start", equity: capital }],
      ...(newStrategy === "rebalancer" ? { stockPct: newStockPct, reitPct: newReitPct, bondPct: newBondPct } : {}),
      ...(newStrategy === "custom_target" ? { targetEquity: Number(newTargetEquity), takeProfit: Number(newTakeProfit), stopLoss: Number(newStopLoss) } : {}),
    };

    // Immediately simulate first trades
    const simulated = simulateAgent(agent);
    setAgents(prev => [...prev, simulated]);
    setCreating(false);
    toast({ title: "Agent Deployed! 🤖", description: `${agent.name} is now trading with $${capital.toLocaleString()}` });
  }

  const totalEquity = agents.reduce((s, a) => s + a.currentEquity, 0);
  const totalPnl = agents.reduce((s, a) => s + (a.currentEquity - a.startingCapital), 0);
  const runningCount = agents.filter(a => a.status === "running").length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground font-medium">Total AUM</p>
          <p className="text-xl font-bold">${totalEquity.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground font-medium">Total P&L</p>
          <p className={`text-xl font-bold ${totalPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
            {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
          </p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground font-medium">Active Agents</p>
          <p className="text-xl font-bold text-primary">{runningCount}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground font-medium">Total Agents</p>
          <p className="text-xl font-bold">{agents.length}</p>
        </CardContent></Card>
      </div>

      {/* Deploy button */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Deploy New Agent
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Bot className="w-5 h-5" /> Deploy AI Trading Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Agent Name</label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Alpha Agent" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Strategy</label>
              <Select value={newStrategy} onValueChange={(v: "rebalancer" | "custom_target") => setNewStrategy(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rebalancer">🎯 Target Allocation Rebalancer</SelectItem>
                  <SelectItem value="custom_target">🚀 Custom Equity Target</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Starting Capital ($)</label>
              <Input type="number" value={newCapital} onChange={e => setNewCapital(e.target.value)} min="100" />
            </div>

            {newStrategy === "rebalancer" && (
              <div className="space-y-3 p-3 rounded-lg border border-border/50 bg-muted/20">
                <p className="text-xs font-medium text-foreground">Target Allocation</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Stocks / ETFs</span>
                    <span className="text-xs font-bold">{newStockPct}%</span>
                  </div>
                  <Slider value={[newStockPct]} onValueChange={([v]) => { setNewStockPct(v); setNewBondPct(Math.max(0, 100 - v - newReitPct)); }} min={0} max={100} step={5} />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">REITs</span>
                    <span className="text-xs font-bold">{newReitPct}%</span>
                  </div>
                  <Slider value={[newReitPct]} onValueChange={([v]) => { setNewReitPct(v); setNewBondPct(Math.max(0, 100 - newStockPct - v)); }} min={0} max={100} step={5} />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Bonds</span>
                    <span className="text-xs font-bold">{newBondPct}%</span>
                  </div>
                  <Slider value={[newBondPct]} onValueChange={([v]) => { setNewBondPct(v); setNewReitPct(Math.max(0, 100 - newStockPct - v)); }} min={0} max={100} step={5} />
                </div>
              </div>
            )}

            {newStrategy === "custom_target" && (
              <div className="space-y-3 p-3 rounded-lg border border-border/50 bg-muted/20">
                <p className="text-xs font-medium text-foreground">Target Configuration</p>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Target Equity ($)</label>
                  <Input type="number" value={newTargetEquity} onChange={e => setNewTargetEquity(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Take Profit (%)</label>
                    <Input type="number" value={newTakeProfit} onChange={e => setNewTakeProfit(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Stop Loss (%)</label>
                    <Input type="number" value={newStopLoss} onChange={e => setNewStopLoss(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Max Position %</label>
                <Input type="number" value={newMaxPosPct} onChange={e => setNewMaxPosPct(Number(e.target.value))} min={5} max={50} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Trade Frequency</label>
                <Select value={newFrequency} onValueChange={setNewFrequency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span><strong>Demo Mode:</strong> Agent runs with simulated trades. Connect Alpaca API keys for paper trading.</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={createAgent} className="gap-2"><Zap className="w-4 h-4" /> Deploy Agent</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Agent Cards */}
      {agents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Bot className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-lg font-semibold text-foreground">No Trading Agents Deployed</p>
            <p className="text-sm text-muted-foreground mt-1">Deploy your first AI trading agent to start autonomous investing</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {agents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onStart={() => setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: "running" } : a))}
                onStop={() => setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: "stopped" } : a))}
                onDelete={() => {
                  setAgents(prev => prev.filter(a => a.id !== agent.id));
                  if (expandedId === agent.id) setExpandedId(null);
                  toast({ title: "Agent Removed", description: `${agent.name} has been deleted.` });
                }}
                onExpand={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
              />
            ))}
          </div>

          {/* Expanded Details */}
          {expandedId && agents.find(a => a.id === expandedId) && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  {agents.find(a => a.id === expandedId)!.name} — Detailed View
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setExpandedId(null)}>
                  <ChevronUp className="w-4 h-4" /> Collapse
                </Button>
              </div>
              <AgentDetails agent={agents.find(a => a.id === expandedId)!} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
