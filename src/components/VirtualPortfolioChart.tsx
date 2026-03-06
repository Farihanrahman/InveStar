import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type TimePeriod = "1D" | "1W" | "1M" | "6M" | "1Y" | "5Y";

const VirtualPortfolioChart = () => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("1W");

  const portfolioDataMap: Record<TimePeriod, { date: string; value: number }[]> = {
    "1D": [
      { date: "9AM", value: 105000 },
      { date: "10AM", value: 105100 },
      { date: "11AM", value: 104900 },
      { date: "12PM", value: 105200 },
      { date: "1PM", value: 105300 },
      { date: "2PM", value: 105150 },
      { date: "3PM", value: 105234 },
    ],
    "1W": [
      { date: "Mon", value: 100000 },
      { date: "Tue", value: 101200 },
      { date: "Wed", value: 100800 },
      { date: "Thu", value: 103400 },
      { date: "Fri", value: 102900 },
      { date: "Sat", value: 104500 },
      { date: "Sun", value: 105234 },
    ],
    "1M": [
      { date: "Wk 1", value: 100000 },
      { date: "Wk 2", value: 101500 },
      { date: "Wk 3", value: 102800 },
      { date: "Wk 4", value: 105234 },
    ],
    "6M": [
      { date: "Jun", value: 95000 },
      { date: "Jul", value: 97000 },
      { date: "Aug", value: 98500 },
      { date: "Sep", value: 100000 },
      { date: "Oct", value: 102000 },
      { date: "Nov", value: 105234 },
    ],
    "1Y": [
      { date: "Jan", value: 85000 },
      { date: "Mar", value: 88000 },
      { date: "May", value: 92000 },
      { date: "Jul", value: 97000 },
      { date: "Sep", value: 100000 },
      { date: "Nov", value: 105234 },
    ],
    "5Y": [
      { date: "2020", value: 50000 },
      { date: "2021", value: 65000 },
      { date: "2022", value: 75000 },
      { date: "2023", value: 85000 },
      { date: "2024", value: 95000 },
      { date: "2025", value: 105234 },
    ],
  };

  const portfolioData = portfolioDataMap[timePeriod];

  const currentValue = portfolioData[portfolioData.length - 1].value;
  const startValue = portfolioData[0].value;
  const percentChange = ((currentValue - startValue) / startValue * 100).toFixed(2);
  const dollarChange = (currentValue - startValue).toFixed(2);

  const timePeriods: TimePeriod[] = ["1D", "1W", "1M", "6M", "1Y", "5Y"];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between mb-4">
          <div>
            <CardTitle>Portfolio Performance</CardTitle>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-3xl font-bold">${currentValue.toLocaleString()}</span>
              <span className={`text-lg font-semibold ${parseFloat(percentChange) >= 0 ? 'text-accent' : 'text-destructive'}`}>
                {parseFloat(percentChange) >= 0 ? '+' : ''}{percentChange}%
              </span>
              <span className={`text-sm ${parseFloat(dollarChange) >= 0 ? 'text-accent' : 'text-destructive'}`}>
                {parseFloat(dollarChange) >= 0 ? '+' : ''}${dollarChange}
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            {timePeriods.map((period) => (
              <Button
                key={period}
                variant={timePeriod === period ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimePeriod(period)}
                className="h-8 px-3 text-xs"
              >
                {period}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={portfolioData}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              fill="url(#portfolioGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default VirtualPortfolioChart;
