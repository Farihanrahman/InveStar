import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, ExternalLink, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isConnected, getPublicKey, requestAccess } from "@stellar/freighter-api";

export const FreighterWallet = () => {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const FREIGHTER_TIMEOUT_MS = 10000;

  const withTimeout = async <T,>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string,
  ): Promise<T> => {
    let timeoutId: number | undefined;

    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      return result as T;
    } finally {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      console.log("🔍 Checking Freighter connection on mount...");
      const freighterAvailable =
        typeof (window as any).freighterApi !== "undefined" ||
        typeof (window as any).freighter !== "undefined";

      console.log("🔍 Freighter available on mount:", freighterAvailable);

      if (!freighterAvailable) {
        return;
      }

      const alreadyConnected = await withTimeout(
        isConnected(),
        FREIGHTER_TIMEOUT_MS,
        "Freighter connection check timed out.",
      );

      console.log("🔍 isConnected (mount):", alreadyConnected);

      if (alreadyConnected) {
        const key = await withTimeout(
          getPublicKey(),
          FREIGHTER_TIMEOUT_MS,
          "Fetching Freighter public key timed out.",
        );
        setPublicKey(key);
        setConnected(true);
      }
    } catch (error) {
      console.error("Freighter check error:", error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      console.log("🔍 Attempting Freighter connection from Wallet page...");

      const freighterAvailable =
        typeof (window as any).freighterApi !== "undefined" ||
        typeof (window as any).freighter !== "undefined";

      console.log("🔍 Freighter available on click:", freighterAvailable);

      if (!freighterAvailable) {
        const inIframe = window.top !== window.self;
        const description = inIframe
          ? "Browser extensions often can't access the in-editor preview. Click the ↗ button in the top bar to open this app in a new tab, then try connecting again."
          : "The Freighter extension isn't available in this window. Please ensure it is installed, enabled, and allowed for this site.";
        toast({
          title: "Freighter Not Detected",
          description,
          variant: "destructive",
        });
        return;
      }

      const alreadyConnected = await withTimeout(
        isConnected(),
        FREIGHTER_TIMEOUT_MS,
        "Freighter connection check timed out. Please try again.",
      );

      console.log("🔍 isConnected (click):", alreadyConnected);

      if (alreadyConnected) {
        const key = await withTimeout(
          getPublicKey(),
          FREIGHTER_TIMEOUT_MS,
          "Fetching Freighter public key timed out.",
        );
        console.log("✅ Got public key (already connected):", key);
        setPublicKey(key);
        setConnected(true);
        toast({
          title: "Connected!",
          description: "Freighter wallet already connected.",
        });
        return;
      }

      const accessGranted = await withTimeout(
        requestAccess(),
        FREIGHTER_TIMEOUT_MS,
        "Connection request timed out. Please check the Freighter popup and try again.",
      );
      console.log("🔍 requestAccess result:", accessGranted);

      if (accessGranted) {
        const key = await withTimeout(
          getPublicKey(),
          FREIGHTER_TIMEOUT_MS,
          "Fetching Freighter public key timed out.",
        );
        console.log("✅ Got public key:", key);
        setPublicKey(key);
        setConnected(true);
        toast({
          title: "Connected!",
          description: "Freighter wallet connected successfully.",
        });
      } else {
        console.log("❌ Access not granted");
        toast({
          title: "Connection Cancelled",
          description: "You cancelled the Freighter connection request.",
        });
      }
    } catch (error) {
      console.error("❌ Freighter connection error:", error);

      const description =
        error instanceof Error && error.message
          ? error.message
          : "Connection failed. Please check the Freighter popup and ensure the extension is unlocked and allowed for this site.";

      toast({
        title: "Connection Failed",
        description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleDisconnect = () => {
    setPublicKey(null);
    setConnected(false);
    toast({
      title: "Disconnected",
      description: "Freighter wallet disconnected.",
    });
  };

  const copyToClipboard = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Public key copied to clipboard.",
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!connected ? (
        <Button onClick={handleConnect} disabled={loading} variant="outline" size="sm" className="gap-2">
          <Wallet className="w-4 h-4" />
          {loading ? "Connecting..." : "Connect Freighter"}
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-500/10 text-green-500 gap-1">
            <Wallet className="w-3 h-3" />
            Connected
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyToClipboard}
            className="h-8 w-8"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      )}
    </div>
  );
};
