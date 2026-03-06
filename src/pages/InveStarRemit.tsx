import { useState, useRef, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Loader2, Wallet, Calendar, Clock, ArrowRight, Sparkles, Users } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/remit-agent`;

const QUICK_ACTIONS = [
  "Send $100 to family via bKash",
  "Set up monthly transfer",
  "Check transfer history",
  "What's the USD/BDT rate?",
  "How much will ৳10,000 cost in USD?",
];

const InveStarRemit = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [recipients, setRecipients] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load user data
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [recipientRes, scheduleRes, txRes] = await Promise.all([
        supabase.from("remit_recipients").select("*").eq("user_id", user.id),
        supabase.from("remit_schedules").select("*, remit_recipients(name, mobile, method)").eq("user_id", user.id),
        supabase.from("remit_transactions").select("*, remit_recipients(name, mobile, method)").eq("user_id", user.id).order("executed_at", { ascending: false }).limit(20),
      ]);

      if (recipientRes.data) setRecipients(recipientRes.data);
      if (scheduleRes.data) setSchedules(scheduleRes.data);
      if (txRes.data) setTransactions(txRes.data);
    };
    loadData();
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }
      if (!resp.body) throw new Error("No stream");

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
      toast({ title: "Agent Error", description: e.message, variant: "destructive" });
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">InveStar Remit</h1>
              <p className="text-sm text-muted-foreground">Send money to Bangladesh · bKash · Nagad · Bank</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-medium text-accent">Agent Active</span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="chat" className="gap-2"><Send className="w-3.5 h-3.5" />Send</TabsTrigger>
            <TabsTrigger value="recipients" className="gap-2"><Users className="w-3.5 h-3.5" />Recipients</TabsTrigger>
            <TabsTrigger value="schedules" className="gap-2"><Calendar className="w-3.5 h-3.5" />Recurring</TabsTrigger>
            <TabsTrigger value="history" className="gap-2"><Clock className="w-3.5 h-3.5" />History</TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            {/* Chat Area */}
            <Card className="mb-4 min-h-[400px] max-h-[55vh] overflow-y-auto">
              <CardContent className="p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-accent/40" />
                    <h3 className="text-lg font-semibold mb-2">💸 InveStar Remit</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Tell me who you want to send money to and I'll handle everything — rates, verification, and execution.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {QUICK_ACTIONS.map(q => (
                        <Button key={q} variant="outline" size="sm" onClick={() => sendMessage(q)} className="text-xs">
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 ${msg.role === "user" ? "bg-accent text-accent-foreground" : "bg-muted/50 border border-border"}`}>
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
                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                placeholder="e.g. Send $200 to my mother via bKash..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()} className="gap-2 bg-gradient-to-r from-accent to-primary">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="recipients">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Saved Recipients</CardTitle>
              </CardHeader>
              <CardContent>
                {recipients.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    No saved recipients yet. Send money to someone and they'll appear here.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recipients.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                        <div>
                          <p className="font-medium text-sm">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.mobile} · {r.method}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {r.is_default && <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">Default</span>}
                          <Button size="sm" variant="outline" onClick={() => sendMessage(`Send money to ${r.name} via ${r.method}`)}>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedules">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recurring Transfers</CardTitle>
              </CardHeader>
              <CardContent>
                {schedules.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    No recurring transfers set up yet. Ask the agent to "set up a monthly transfer".
                  </p>
                ) : (
                  <div className="space-y-3">
                    {schedules.map(s => (
                      <div key={s.id} className="p-3 rounded-lg bg-muted/30 border border-border">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">${s.amount_usd} {s.frequency} to {s.remit_recipients?.name}</p>
                            <p className="text-xs text-muted-foreground">Next: {s.next_run_date} · {s.purpose}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"}`}>
                            {s.is_active ? "Active" : "Paused"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transfer History</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    No transfers yet. Start your first transfer above!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map(tx => (
                      <div key={tx.id} className="p-3 rounded-lg bg-muted/30 border border-border">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">${tx.amount_usd} → ৳{tx.amount_bdt}</p>
                            <p className="text-xs text-muted-foreground">
                              To: {tx.remit_recipients?.name} · {tx.method} · Rate: {tx.exchange_rate}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.executed_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            tx.status === "completed" ? "bg-accent/20 text-accent" :
                            tx.status === "failed" ? "bg-destructive/20 text-destructive" :
                            "bg-primary/20 text-primary"
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default InveStarRemit;
