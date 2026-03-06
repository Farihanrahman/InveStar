import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieChartIcon } from "lucide-react";

interface Asset {
  id: string;
  name: string;
  type: string;
  value: number;
}

interface NetWorthPieChartProps {
  assets: Asset[];
}

const TYPE_COLORS: Record<string, string> = {
  stocks: "hsl(var(--primary))",
  savings: "hsl(142, 76%, 36%)",
  property: "hsl(24, 95%, 53%)",
  retirement: "hsl(262, 83%, 58%)",
  crypto: "hsl(43, 96%, 56%)",
  vehicle: "hsl(199, 89%, 48%)",
  business: "hsl(340, 82%, 52%)",
  other: "hsl(var(--muted-foreground))",
};

const TYPE_LABELS: Record<string, string> = {
  stocks: "Investments",
  savings: "Savings",
  property: "Real Estate",
  retirement: "Retirement",
  crypto: "Crypto",
  vehicle: "Vehicles",
  business: "Business",
  other: "Other",
};

const NetWorthPieChart = ({ assets }: NetWorthPieChartProps) => {
  if (assets.length === 0) return null;

  // Group by type
  const grouped = assets.reduce((acc, asset) => {
    const type = asset.type || "other";
    if (!acc[type]) acc[type] = 0;
    acc[type] += asset.value;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(grouped)
    .map(([type, value]) => ({
      name: TYPE_LABELS[type] || type,
      value,
      type,
    }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <PieChartIcon className="w-4 h-4" />
          Allocation by Type
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.type}
                  fill={TYPE_COLORS[entry.type] || TYPE_COLORS.other}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [
                `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                "Value",
              ]}
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend
              formatter={(value, entry) => {
                const item = data.find((d) => d.name === value);
                const pct = item ? ((item.value / total) * 100).toFixed(1) : "0";
                return (
                  <span className="text-xs">
                    {value} ({pct}%)
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default NetWorthPieChart;
