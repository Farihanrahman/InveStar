import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export type StellarNetwork = "testnet" | "mainnet";

interface NetworkSwitcherProps {
  network: StellarNetwork;
  onNetworkChange: (network: StellarNetwork) => void;
}

export const NetworkSwitcher = ({ network, onNetworkChange }: NetworkSwitcherProps) => {
  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-muted-foreground" />
      <div className="flex rounded-lg border overflow-hidden">
        <Button
          variant={network === "testnet" ? "default" : "ghost"}
          size="sm"
          className="rounded-none h-8 text-xs px-3"
          onClick={() => onNetworkChange("testnet")}
        >
          🧪 Testnet
        </Button>
        <Button
          variant={network === "mainnet" ? "default" : "ghost"}
          size="sm"
          className="rounded-none h-8 text-xs px-3"
          onClick={() => onNetworkChange("mainnet")}
        >
          🌐 Mainnet
        </Button>
      </div>
      <Badge
        variant="outline"
        className={network === "mainnet" 
          ? "border-green-500/30 text-green-500 text-xs" 
          : "border-yellow-500/30 text-yellow-500 text-xs"}
      >
        {network === "mainnet" ? "Live" : "Test"}
      </Badge>
    </div>
  );
};
