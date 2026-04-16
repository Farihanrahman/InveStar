import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  CheckCircle2,
  Clock,
  Radio,
  AlertTriangle,
  ArrowRight,
  Zap,
} from "lucide-react";

interface DepositMonitorProps {
  transactionId: string;
  chain: string;
  network: string;
  usdtAmount: number;
  usdcAmount: number;
  depositAddress: string;
  estimatedTime: string;
  onComplete: () => void;
  onCancel: () => void;
}

type DepositStage = "awaiting" | "detected" | "confirming" | "converting" | "complete" | "failed";

interface ChainConfirmation {
  required: number;
  current: number;
}

const CHAIN_CONFIRMATIONS: Record<string, number> = {
  trc20: 19,
  solana: 32,
  ethereum: 12,
};

// Simulated polling intervals
const POLL_INTERVAL_MS = 5000; // 5 seconds
const DETECTION_DELAY_MS = 8000; // Simulate detection after 8s
const CONFIRMATION_STEP_MS = 2000; // Each confirmation step

export const UsdtDepositMonitor = ({
  transactionId,
  chain,
  network,
  usdtAmount,
  usdcAmount,
  depositAddress,
  estimatedTime,
  onComplete,
  onCancel,
}: DepositMonitorProps) => {
  const { token, user } = useOmsAuth();
  const { toast } = useToast();
  const [stage, setStage] = useState<DepositStage>("awaiting");
  const [confirmations, setConfirmations] = useState<ChainConfirmation>({
    required: CHAIN_CONFIRMATIONS[chain] || 12,
    current: 0,
  });
  const [elapsedSec, setElapsedSec] = useState(0);
  const [autoConvertEnabled, setAutoConvertEnabled] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detectedRef = useRef(false);

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulated deposit detection (in production: poll mempool / chain APIs)
  useEffect(() => {
    if (stage !== "awaiting") return;

    const timeout = setTimeout(() => {
      if (!detectedRef.current) {
        detectedRef.current = true;
        setStage("detected");
        toast({
          title: "USDT Deposit Detected! 🔍",
          description: `${usdtAmount} USDT incoming on ${network}. Waiting for confirmations...`,
        });

        // Start confirmation simulation
        setTimeout(() => setStage("confirming"), 1500);
      }
    }, DETECTION_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [stage, usdtAmount, network, toast]);

  // Simulated confirmation progress
  useEffect(() => {
    if (stage !== "confirming") return;

    confirmRef.current = setInterval(() => {
      setConfirmations((prev) => {
        const next = prev.current + Math.ceil(prev.required / 6);
        if (next >= prev.required) {
          clearInterval(confirmRef.current!);
          // Move to converting stage
          setTimeout(() => {
            setStage("converting");
            if (autoConvertEnabled) {
              triggerAutoConversion();
            }
          }, 500);
          return { ...prev, current: prev.required };
        }
        return { ...prev, current: next };
      });
    }, CONFIRMATION_STEP_MS);

    return () => {
      if (confirmRef.current) clearInterval(confirmRef.current);
    };
  }, [stage, autoConvertEnabled]);

  const triggerAutoConversion = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("usdt-intake", {
        body: {
          action: "complete_deposit",
          transactionId,
          omsUserId: user?.id ? String(user.id) : undefined,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (error) throw error;

      if (data.success) {
        setStage("complete");
        toast({
          title: "Auto-Conversion Complete! ✅",
          description: `${usdtAmount} USDT → ${usdcAmount} USDC credited to your wallet`,
        });
        setTimeout(onComplete, 2000);
      } else {
        throw new Error(data.error || "Conversion failed");
      }
    } catch (e: any) {
      setStage("failed");
      toast({
        title: "Conversion Error",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const confirmProgress =
    confirmations.required > 0
      ? Math.min(100, (confirmations.current / confirmations.required) * 100)
      : 0;

  const stageConfig: Record<
    DepositStage,
    { icon: any; color: string; label: string; pulse: boolean }
  > = {
    awaiting: { icon: Radio, color: "text-amber-500", label: "Scanning Mempool…", pulse: true },
    detected: { icon: Zap, color: "text-blue-500", label: "Deposit Detected!", pulse: true },
    confirming: { icon: Clock, color: "text-blue-500", label: "Confirming on Chain", pulse: false },
    converting: { icon: Loader2, color: "text-primary", label: "Converting USDT → USDC", pulse: false },
    complete: { icon: CheckCircle2, color: "text-green-500", label: "Complete!", pulse: false },
    failed: { icon: AlertTriangle, color: "text-destructive", label: "Failed", pulse: false },
  };

  const currentStage = stageConfig[stage];
  const StageIcon = currentStage.icon;

  return (
    <Card className="border-primary/20 overflow-hidden">
      {/* Progress bar at top */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{
            width: `${
              stage === "awaiting"
                ? 10
                : stage === "detected"
                ? 25
                : stage === "confirming"
                ? 25 + confirmProgress * 0.5
                : stage === "converting"
                ? 85
                : stage === "complete"
                ? 100
                : 0
            }%`,
          }}
        />
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Header with live status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`relative ${currentStage.pulse ? "animate-pulse" : ""}`}>
              <StageIcon
                className={`w-5 h-5 ${currentStage.color} ${
                  stage === "converting" ? "animate-spin" : ""
                }`}
              />
            </div>
            <div>
              <p className="font-semibold text-sm">{currentStage.label}</p>
              <p className="text-[10px] text-muted-foreground">
                {network} • {formatTime(elapsedSec)} elapsed
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={`text-[9px] ${
              stage === "complete"
                ? "bg-green-500/10 text-green-500"
                : stage === "failed"
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary"
            }`}
          >
            {stage === "complete" ? "Done" : stage === "failed" ? "Error" : "Live"}
          </Badge>
        </div>

        {/* Transaction details */}
        <div className="p-3 rounded-lg bg-muted/50 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deposit:</span>
            <span className="font-medium">{usdtAmount} USDT</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Chain:</span>
            <span>{network}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Output:</span>
            <span className="font-medium text-green-500">{usdcAmount} USDC</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Address:</span>
            <code className="text-[9px] truncate max-w-[160px]">{depositAddress}</code>
          </div>
        </div>

        {/* Confirmation progress */}
        {(stage === "confirming" || stage === "converting" || stage === "complete") && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Block Confirmations</span>
              <span className="font-mono text-xs">
                {Math.min(confirmations.current, confirmations.required)}/{confirmations.required}
              </span>
            </div>
            <Progress value={confirmProgress} className="h-2" />
          </div>
        )}

        {/* Auto-convert toggle */}
        {stage !== "complete" && stage !== "failed" && (
          <div className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium">Auto-Convert to USDC</span>
            </div>
            <button
              onClick={() => setAutoConvertEnabled(!autoConvertEnabled)}
              className={`w-9 h-5 rounded-full transition-all flex items-center ${
                autoConvertEnabled ? "bg-primary justify-end" : "bg-muted justify-start"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-background shadow-sm mx-0.5" />
            </button>
          </div>
        )}

        {/* Manual conversion button (if auto-convert disabled) */}
        {stage === "converting" && !autoConvertEnabled && (
          <Button onClick={triggerAutoConversion} className="w-full gap-2">
            Convert Now <ArrowRight className="w-4 h-4" />
          </Button>
        )}

        {/* Pipeline visualization */}
        <div className="flex items-center justify-between px-2 py-3">
          {[
            { label: "Detect", done: ["detected", "confirming", "converting", "complete"].includes(stage) },
            { label: "Confirm", done: ["converting", "complete"].includes(stage) },
            { label: "Convert", done: stage === "complete" },
            { label: "Credit", done: stage === "complete" },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center gap-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  step.done
                    ? "bg-green-500 text-green-50"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step.done ? "✓" : i + 1}
              </div>
              <span className="text-[9px] text-muted-foreground">{step.label}</span>
              {i < arr.length - 1 && (
                <div className={`w-6 h-px mx-0.5 ${step.done ? "bg-green-500" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Cancel */}
        {stage !== "complete" && (
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={onCancel}>
            Cancel Monitoring
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
