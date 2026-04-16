import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, X, MessageSquare, Loader2, Search, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import AIAnalystChart from "@/components/AIAnalystChart";

interface ChartData {
  chart_type: string;
  title: string;
  data: Array<{
    label: string;
    value?: number;
    value2?: number;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
  }>;
  series_labels?: string[];
  y_axis_prefix?: string;
  color?: string;
}

interface MessagePart {
  type: "text" | "chart" | "thinking";
  content?: string;
  chart?: ChartData;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  parts?: MessagePart[];
}

interface AIAnalystPanelProps {
  context: "markets" | "virtual-trading" | "portfolio";
  isOpen: boolean;
  onToggle: () => void;
  initialQuery?: string;
}

const contextHints: Record<string, string> = {
  markets: "Ask about any stock, crypto, or market…",
  "virtual-trading": "Analyze your virtual portfolio…",
  portfolio: "Get insights on your holdings…",
};

const AIAnalystPanel = ({ context, isOpen, onToggle, initialQuery }: AIAnalystPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState("");
  const [initialQuerySent, setInitialQuerySent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinkingText]);

  // Auto-send initial query when panel opens with one
  useEffect(() => {
    if (isOpen && initialQuery && !initialQuerySent && messages.length === 0) {
      setInitialQuerySent(true);
      const userMsg: Message = { role: "user", content: initialQuery };
      setMessages([userMsg]);
      setIsLoading(true);
      setThinkingText("Thinking…");
      streamAnalyst(userMsg).then(() => {
        setIsLoading(false);
        setThinkingText("");
      });
    }
  }, [isOpen, initialQuery, initialQuerySent]);

  const streamAnalyst = useCallback(async (userMessage: Message) => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/investar-analyst`;
    let assistantContent = "";
    const charts: ChartData[] = [];

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: [...messages.map(m => ({ role: m.role, content: m.content })), { role: userMessage.role, content: userMessage.content }],
          context,
          userId: session?.user?.id || null,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) { toast.error("Rate limit exceeded. Try again shortly."); return; }
        if (response.status === 402) { toast.error("AI credits exhausted."); return; }
        throw new Error("Failed to connect to AI analyst");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let nl;
        while ((nl = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);

          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);

            if (parsed.type === "tool_call") {
              const toolLabel = parsed.tool === "web_search" ? `🔍 Searching: ${parsed.args?.query || "..."}` :
                parsed.tool === "generate_chart" ? `📊 Generating chart…` :
                  `🔧 ${parsed.tool}…`;
              setThinkingText(toolLabel);
            } else if (parsed.type === "tool_result") {
              setThinkingText("Analyzing results…");
            } else if (parsed.type === "chart") {
              charts.push(parsed as ChartData);
              setThinkingText("");
            } else if (parsed.type === "content") {
              setThinkingText("");
              assistantContent += parsed.content;
              // Build parts with interspersed charts
              const parts: MessagePart[] = [];
              if (charts.length > 0) {
                charts.forEach(c => parts.push({ type: "chart", chart: c }));
              }
              parts.push({ type: "text", content: assistantContent });

              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent, parts } : m);
                }
                return [...prev, { role: "assistant", content: assistantContent, parts }];
              });
            } else if (parsed.type === "error") {
              toast.error(parsed.content);
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }

      // Final flush — ensure charts are included even if no text followed
      if (charts.length > 0 && !assistantContent) {
        const parts: MessagePart[] = charts.map(c => ({ type: "chart", chart: c }));
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, parts } : m);
          }
          return [...prev, { role: "assistant", content: "", parts }];
        });
      }
    } catch (error) {
      console.error("Analyst error:", error);
      toast.error("Failed to get analysis. Please try again.");
    }
  }, [messages, context]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setThinkingText("Thinking…");
    await streamAnalyst(userMsg);
    setIsLoading(false);
    setThinkingText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed right-4 bottom-4 z-50 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        size="icon"
      >
        <Bot className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-[420px] max-w-[95vw] z-50 bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Analyst</h3>
            <p className="text-xs text-muted-foreground">Powered by AI • Real-time data</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Ask me about any stock, crypto, or market. I'll give you real-time data with charts.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["NVDA price", "Compare AAPL vs GOOGL", "Bitcoin analysis", "Portfolio review"].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <div className={`max-w-[85%] ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-lg px-3 py-2" : ""}`}>
                {msg.role === "assistant" && msg.parts ? (
                  <div className="space-y-3">
                    {msg.parts.map((part, j) => (
                      part.type === "chart" && part.chart ? (
                        <AIAnalystChart key={j} chart={part.chart} />
                      ) : part.type === "text" && part.content ? (
                        <div key={j} className="prose prose-sm dark:prose-invert max-w-none text-sm">
                          <ReactMarkdown>{part.content}</ReactMarkdown>
                        </div>
                      ) : null
                    ))}
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {thinkingText && (
            <div className="flex gap-2 items-start">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{thinkingText}</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t bg-card">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={contextHints[context] || "Ask anything…"}
            className="min-h-[44px] max-h-[120px] resize-none text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[44px] w-[44px] flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIAnalystPanel;
