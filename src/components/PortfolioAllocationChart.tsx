import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface HoldingData {
  symbol: string;
  name: string;
  totalValue: number;
  returnPercent: number;
  isPositive: boolean;
}

interface PortfolioAllocationChartProps {
  holdings: HoldingData[];
  totalValue: number;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(142, 76%, 36%)', // green
  'hsl(217, 91%, 60%)', // blue
  'hsl(280, 65%, 60%)', // purple
  'hsl(25, 95%, 53%)',  // orange
  'hsl(340, 82%, 52%)', // pink
  'hsl(180, 70%, 45%)', // teal
  'hsl(45, 93%, 47%)',  // yellow
  'hsl(330, 70%, 50%)', // magenta
];

const PortfolioAllocationChart = ({ holdings, totalValue }: PortfolioAllocationChartProps) => {
  if (holdings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Portfolio Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Add holdings to see your portfolio allocation
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = holdings.map((holding, index) => ({
    name: holding.symbol,
    fullName: holding.name,
    value: holding.totalValue,
    percentage: totalValue > 0 ? (holding.totalValue / totalValue) * 100 : 0,
    returnPercent: holding.returnPercent,
    isPositive: holding.isPositive,
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
          <p className="font-bold text-sm">{data.name}</p>
          <p className="text-xs text-muted-foreground mb-2">{data.fullName}</p>
          <div className="space-y-1">
            <p className="text-sm">
              Value: <span className="font-medium">${data.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </p>
            <p className="text-sm">
              Allocation: <span className="font-medium">{data.percentage.toFixed(1)}%</span>
            </p>
            <p className={`text-sm flex items-center gap-1 ${data.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              Return: 
              {data.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span className="font-medium">{data.isPositive ? '+' : ''}{data.returnPercent.toFixed(2)}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {payload?.map((entry: any, index: number) => {
          const data = chartData.find(d => d.name === entry.value);
          return (
            <div
              key={`legend-${index}`}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-xs"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium">{entry.value}</span>
              <span className="text-muted-foreground">
                ({data?.percentage.toFixed(1)}%)
              </span>
              <span className={data?.isPositive ? 'text-green-500' : 'text-red-500'}>
                {data?.isPositive ? '+' : ''}{data?.returnPercent.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Portfolio Allocation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Holdings breakdown list */}
        <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
          {chartData
            .sort((a, b) => b.percentage - a.percentage)
            .map((holding, index) => (
              <div
                key={holding.name}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: holding.color }}
                  />
                  <div>
                    <p className="font-medium text-sm">{holding.name}</p>
                    <p className="text-xs text-muted-foreground">{holding.fullName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">
                    ${holding.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center justify-end gap-2 text-xs">
                    <span className="text-muted-foreground">{holding.percentage.toFixed(1)}%</span>
                    <span className={`flex items-center gap-0.5 ${holding.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {holding.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {holding.isPositive ? '+' : ''}{holding.returnPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioAllocationChart;
