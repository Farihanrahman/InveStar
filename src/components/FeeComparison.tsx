import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Clock, DollarSign } from "lucide-react";

interface FeeRoute {
  method: string;
  fee: string;
  feePercent: number;
  speed: string;
  rate: string;
  total: string;
  recommended?: boolean;
}

interface FeeComparisonProps {
  amount: number;
  currency: string;
}

const FeeComparison = ({ amount, currency }: FeeComparisonProps) => {
  // Simulated fee comparison data based on amount
  const routes: FeeRoute[] = [
    {
      method: "InveStar Wallet (USDC)",
      fee: "$0.01",
      feePercent: 0.01,
      speed: "~10 seconds",
      rate: "Mid-market",
      total: `$${(amount * 0.9999).toFixed(2)}`,
      recommended: true,
    },
    {
      method: "Bank Transfer (SWIFT)",
      fee: `$${Math.max(15, amount * 0.02).toFixed(2)}`,
      feePercent: Math.max(2, (15 / amount) * 100),
      speed: "2-5 business days",
      rate: "Bank rate (+1-3%)",
      total: `$${(amount * 0.97).toFixed(2)}`,
    },
    {
      method: "PayPal",
      fee: `$${(amount * 0.029 + 0.30).toFixed(2)}`,
      feePercent: 2.9,
      speed: "Instant-1 day",
      rate: "PayPal rate (+2.5%)",
      total: `$${(amount * 0.946).toFixed(2)}`,
    },
    {
      method: "MoneyGram",
      fee: `$${Math.max(5, amount * 0.015).toFixed(2)}`,
      feePercent: Math.max(1.5, (5 / amount) * 100),
      speed: "Minutes (cash pickup)",
      rate: "MoneyGram rate (+1%)",
      total: `$${(amount * 0.975).toFixed(2)}`,
    },
  ];

  return (
    <Card className="border-accent/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="w-4 h-4 text-accent" />
          Fee Comparison for ${amount} → {currency}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {routes.map((route) => (
            <div
              key={route.method}
              className={`flex items-center justify-between p-3 rounded-lg border text-sm ${
                route.recommended
                  ? "border-accent/50 bg-accent/5"
                  : "border-border"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{route.method}</span>
                  {route.recommended && (
                    <Badge className="text-[10px] bg-accent/20 text-accent border-accent/30">
                      <Zap className="w-3 h-3 mr-0.5" /> Best
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> {route.fee}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {route.speed}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{route.total}</div>
                <div className="text-xs text-muted-foreground">received</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-3 text-center">
          Fees are estimates and may vary. USDC transfers use mid-market FX rates.
        </p>
      </CardContent>
    </Card>
  );
};

export default FeeComparison;
