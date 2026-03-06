import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Wallet, DollarSign, Activity } from "lucide-react";

interface PortfolioStatsProps {
  totalValue?: number;
}

const PortfolioStats = ({ totalValue = 45234.50 }: PortfolioStatsProps) => {
  // Calculate derived stats based on total value
  const todaysReturn = totalValue * 0.028; // ~2.8% daily return
  const totalReturn = totalValue * 0.142; // ~14.2% total return
  const buyingPower = 12500.00;

  const stats = [
    {
      title: "Total Value",
      value: `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: "+12.5%",
      icon: Wallet,
      isPositive: true,
    },
    {
      title: "Today's Return",
      value: `$${todaysReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: "+2.8%",
      icon: TrendingUp,
      isPositive: true,
    },
    {
      title: "Total Return",
      value: `$${totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: "+14.2%",
      icon: DollarSign,
      isPositive: true,
    },
    {
      title: "Buying Power",
      value: `$${buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: "Available",
      icon: Activity,
      isPositive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.isPositive ? 'text-accent' : 'text-muted-foreground'}`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PortfolioStats;
