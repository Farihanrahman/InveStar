import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Wallet, Copy, Check, ExternalLink, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConnectedWallet {
  name: string;
  publicKey: string;
  icon?: string;
}

const STELLAR_WALLETS = [
  {
    name: "Freighter",
    id: "freighter",
    icon: "🦊",
    description: "Browser extension wallet by SDF",
    url: "https://freighter.app",
    detect: () => typeof (window as any).freighterApi !== "undefined" || typeof (window as any).freighter !== "undefined",
  },
  {
    name: "Lobstr",
    id: "lobstr",
    icon: "🦞",
    description: "Mobile & web wallet for Stellar",
    url: "https://lobstr.co",
    detect: () => false, // Deep link only
  },
  {
    name: "xBull",
    id: "xbull",
    icon: "🐂",
    description: "Browser extension & PWA wallet",
    url: "https://xbull.app",
    detect: () => typeof (window as any).xBullSDK !== "undefined",
  },
  {
    name: "Rabet",
    id: "rabet",
    icon: "🐰",
    description: "Browser extension wallet for Stellar",
    url: "https://rabet.io",
    detect: () => typeof (window as any).rabet !== "undefined",
  },
  {
    name: "Albedo",
    id: "albedo",
    icon: "🌟",
    description: "Keyless signing for Stellar",
    url: "https://albedo.link",
    detect: () => true, // Web-based, always available via popup
  },
];

interface WalletConnectButtonProps {
  onConnect?: (wallet: ConnectedWallet) => void;
  onDisconnect?: () => void;
  connectedWallet?: ConnectedWallet | null;
}

export const WalletConnectButton = ({ onConnect, onDisconnect, connectedWallet }: WalletConnectButtonProps) => {
  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const TIMEOUT_MS = 15000;

  const withTimeout = async <T,>(promise: Promise<T>, ms: number, msg: string): Promise<T> => {
    let timeoutId: number | undefined;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error(msg)), ms);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  };

  const connectFreighter = async (): Promise<string> => {
    const { isConnected, getPublicKey, requestAccess } = await import("@stellar/freighter-api");
    const connected = await withTimeout(isConnected(), TIMEOUT_MS, "Freighter check timed out");
    if (connected) {
      return await withTimeout(getPublicKey(), TIMEOUT_MS, "Getting key timed out");
    }
    const granted = await withTimeout(requestAccess(), TIMEOUT_MS, "Connection request timed out");
    if (granted) {
      return await withTimeout(getPublicKey(), TIMEOUT_MS, "Getting key timed out");
    }
    throw new Error("Connection cancelled");
  };

  const connectXBull = async (): Promise<string> => {
    const xBull = (window as any).xBullSDK;
    if (!xBull) throw new Error("xBull wallet not detected. Please install the extension.");
    const result = await xBull.connect();
    return result.publicKey;
  };

  const connectRabet = async (): Promise<string> => {
    const rabet = (window as any).rabet;
    if (!rabet) throw new Error("Rabet wallet not detected. Please install the extension.");
    const result = await rabet.connect();
    return result.publicKey;
  };

  const connectAlbedo = async (): Promise<string> => {
    // Albedo uses a popup-based flow
    const albedoUrl = `https://albedo.link/intent/public_key`;
    return new Promise((resolve, reject) => {
      const popup = window.open(
        albedoUrl,
        "albedo",
        "width=400,height=600,left=200,top=100"
      );
      if (!popup) {
        reject(new Error("Popup blocked. Please allow popups for this site."));
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.origin === "https://albedo.link" && event.data?.pubkey) {
          window.removeEventListener("message", handleMessage);
          resolve(event.data.pubkey);
        }
      };
      window.addEventListener("message", handleMessage);

      // Timeout
      setTimeout(() => {
        window.removeEventListener("message", handleMessage);
        reject(new Error("Albedo connection timed out"));
      }, 60000);
    });
  };

  const handleConnect = async (walletId: string, walletName: string) => {
    setConnecting(walletId);
    try {
      let publicKey: string;

      switch (walletId) {
        case "freighter":
          publicKey = await connectFreighter();
          break;
        case "xbull":
          publicKey = await connectXBull();
          break;
        case "rabet":
          publicKey = await connectRabet();
          break;
        case "albedo":
          publicKey = await connectAlbedo();
          break;
        case "lobstr":
          toast({
            title: "Lobstr Wallet",
            description: "Please use the Lobstr app to scan the QR code or use their web wallet at lobstr.co",
          });
          window.open("https://lobstr.co", "_blank");
          return;
        default:
          throw new Error("Wallet not supported yet");
      }

      const wallet: ConnectedWallet = { name: walletName, publicKey };
      onConnect?.(wallet);
      setOpen(false);
      toast({
        title: "Wallet Connected!",
        description: `${walletName} connected: ${publicKey.substring(0, 8)}...${publicKey.substring(publicKey.length - 4)}`,
      });
    } catch (err: any) {
      toast({
        title: "Connection Failed",
        description: err.message || `Failed to connect ${walletName}`,
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  const handleCopy = async () => {
    if (connectedWallet?.publicKey) {
      await navigator.clipboard.writeText(connectedWallet.publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (connectedWallet) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-green-500/10 text-green-500 gap-1">
          <Wallet className="w-3 h-3" />
          {connectedWallet.name}
        </Badge>
        <code className="text-xs text-muted-foreground hidden sm:block">
          {connectedWallet.publicKey.substring(0, 6)}...{connectedWallet.publicKey.substring(connectedWallet.publicKey.length - 4)}
        </code>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDisconnect}>
          <LogOut className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wallet className="w-4 h-4" />
          Connect Other Wallets
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Stellar Wallet</DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to InveStar
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-4">
          {STELLAR_WALLETS.map((w) => {
            const available = w.detect();
            return (
              <button
                key={w.id}
                className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-left disabled:opacity-50"
                onClick={() => handleConnect(w.id, w.name)}
                disabled={connecting !== null}
              >
                <span className="text-2xl">{w.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{w.name}</span>
                    {available && w.id !== "albedo" && w.id !== "lobstr" && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-green-500 border-green-500/30">
                        Detected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{w.description}</p>
                </div>
                {connecting === w.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">
          Don't have a wallet?{" "}
          <a href="https://freighter.app" target="_blank" rel="noreferrer" className="text-primary hover:underline">
            Get Freighter
          </a>
          {" "}or{" "}
          <a href="https://lobstr.co" target="_blank" rel="noreferrer" className="text-primary hover:underline">
            Get Lobstr
          </a>
        </p>
      </DialogContent>
    </Dialog>
  );
};
