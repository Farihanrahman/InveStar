import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area, AreaChart, Bar, BarChart, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

interface ChartData {
  chart_type: string;
  title: string;
  data: Array<{
    label: string;
    value?: number;
    value2?: number;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
  }>;
  series_labels?: string[];
  y_axis_prefix?: string;
  color?: string;
}

const colorMap: Record<string, string> = {
  green: "hsl(142, 76%, 36%)",
  blue: "hsl(217, 91%, 60%)",
  orange: "hsl(25, 95%, 53%)",
  purple: "hsl(263, 70%, 50%)",
  red: "hsl(0, 84%, 60%)",
};

const AIAnalystChart = ({ chart }: { chart: ChartData }) => {
  const primaryColor = colorMap[chart.color || "blue"] || colorMap.blue;
  const secondaryColor = colorMap.orange;
  const prefix = chart.y_axis_prefix || "$";
  const labels = chart.series_labels || [];

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "12px",
  };

  if (chart.chart_type === "comparison") {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-xs font-medium">{chart.title}</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" fontSize={10} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${prefix}${v.toLocaleString()}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [`${prefix}${v.toLocaleString()}`, name]} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line type="monotone" dataKey="value" name={labels[0] || "Series 1"} stroke={primaryColor} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="value2" name={labels[1] || "Series 2"} stroke={secondaryColor} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  if (chart.chart_type === "performance") {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-xs font-medium">{chart.title}</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" fontSize={10} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}%`, "Return"]} />
              <Bar dataKey="value" fill={primaryColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  // Default: price_history / candlestick_summary → area chart
  // Normalize data: AI may return "close", "open", or other fields instead of "value"
  const normalizedData = chart.data
    .map(d => ({
      ...d,
      value: d.value ?? (d as any).close ?? d.open ?? (d as any).high ?? (d as any).price ?? 0,
    }))
    .filter(d => typeof d.value === 'number' && d.value > 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-xs font-medium">{chart.title}</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={normalizedData}>
            <defs>
              <linearGradient id={`grad-${chart.title.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={primaryColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={primaryColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" fontSize={10} stroke="hsl(var(--muted-foreground))" />
            <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${prefix}${v.toLocaleString()}`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${prefix}${v.toLocaleString()}`, "Price"]} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={primaryColor}
              strokeWidth={2}
              fill={`url(#grad-${chart.title.replace(/\s/g, "")})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default AIAnalystChart;
