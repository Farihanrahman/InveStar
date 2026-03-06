import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Holding {
  symbol: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  totalValue: number;
  totalCost: number;
  profitLoss: number;
  profitLossPercent: number;
}

interface VirtualHoldingsProps {
  holdings: Holding[];
  onStockClick: (symbol: string) => void;
  virtualBalance: number;
}

const VirtualHoldings = ({ holdings, onStockClick, virtualBalance }: VirtualHoldingsProps) => {
  const COLORS = [
    'hsl(217, 91%, 60%)',  // Bright blue for first stock
    'hsl(142, 76%, 36%)',  // Green for second stock
    'hsl(45, 93%, 47%)',   // Gold/yellow for third stock
    'hsl(348, 83%, 47%)',  // Red for fourth stock
    'hsl(271, 81%, 56%)',  // Purple for fifth stock
    'hsl(199, 89%, 48%)',  // Cyan for sixth stock
    'hsl(25, 95%, 53%)',   // Orange for seventh stock
    'hsl(168, 76%, 42%)'   // Teal for eighth stock
  ];

  // Prepare data for pie chart with consistent colors
  const chartData = holdings.map((holding, index) => ({
    name: holding.symbol,
    value: holding.totalValue,
    fill: COLORS[index % COLORS.length]
  }));

  const totalPortfolioValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalProfitLoss = totalPortfolioValue - totalCost;
  const totalProfitLossPercent = totalCost > 0 ? ((totalProfitLoss / totalCost) * 100) : 0;

  if (holdings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No holdings yet. Start trading to build your portfolio!
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalAccountValue = totalPortfolioValue + virtualBalance;
  const startingBalance = 10000; // Virtual portfolio starts with $10,000
  const totalReturn = totalAccountValue - startingBalance;
  const totalReturnPercent = ((totalReturn / startingBalance) * 100);

  // Debug logging
  console.log('VirtualHoldings Debug:', {
    holdingsCount: holdings.length,
    virtualBalance,
    totalPortfolioValue,
    totalCost,
    totalAccountValue,
    totalReturn,
    startingBalance
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Performance</CardTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Account Value</p>
            <p className="text-lg font-bold">${totalAccountValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Return</p>
            <p className={`text-lg font-bold ${totalReturn >= 0 ? 'text-accent' : 'text-destructive'}`}>
              {totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}
              <span className="text-sm ml-1">
                ({totalReturn >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%)
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Invested in Stocks</p>
            <p className="text-lg font-bold">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Available Cash</p>
            <p className="text-lg font-bold">${virtualBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Portfolio Allocation</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Holdings List */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Holdings Details</h3>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
              {holdings.map((holding) => (
                <button
                  key={holding.symbol}
                  onClick={() => onStockClick(holding.symbol)}
                  className="w-full p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-left"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-sm">{holding.symbol}</div>
                      <div className="text-xs text-muted-foreground">
                        {holding.quantity} shares @ ${holding.avgCost.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        ${holding.totalValue.toFixed(2)}
                      </div>
                      <div className={`text-xs flex items-center gap-1 justify-end ${
                        holding.profitLoss >= 0 ? 'text-accent' : 'text-destructive'
                      }`}>
                        {holding.profitLoss >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {holding.profitLoss >= 0 ? '+' : ''}${holding.profitLoss.toFixed(2)} 
                        ({holding.profitLoss >= 0 ? '+' : ''}{holding.profitLossPercent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Current: ${holding.currentPrice.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VirtualHoldings;
