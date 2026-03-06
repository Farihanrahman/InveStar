import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";
import { toast } from "sonner";

interface PriceAlert {
  id: string;
  symbol: string;
  target_price: number;
  alert_type: string;
  status: string;
  created_at: string;
}

interface PriceAlertsProps {
  stockPrices: Record<string, { price: number; change: number; changePercent: number }>;
}

const PriceAlerts = ({ stockPrices }: PriceAlertsProps) => {
  const { isAuthenticated, user: omsUser } = useOmsAuth();
  const userId = omsUser?.id?.toString() || null;
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [symbol, setSymbol] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [alertType, setAlertType] = useState<"above" | "below">("above");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchAlerts();
    } else {
      setLoading(false);
    }
    // Check alerts every 30 seconds
    const interval = setInterval(checkAlerts, 30000);
    return () => clearInterval(interval);
  }, [stockPrices, isAuthenticated, userId]);

  const fetchAlerts = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("price_alerts")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkAlerts = async () => {
    if (!userId) return;

    for (const alert of alerts) {
      const currentPrice = stockPrices[alert.symbol]?.price;
      if (!currentPrice) continue;

      const shouldTrigger =
        (alert.alert_type === "above" && currentPrice >= alert.target_price) ||
        (alert.alert_type === "below" && currentPrice <= alert.target_price);

      if (shouldTrigger) {
        // Update alert status
        await supabase
          .from("price_alerts")
          .update({ status: "triggered", triggered_at: new Date().toISOString() })
          .eq("id", alert.id);

        const notificationTitle = `Price Alert: ${alert.symbol}`;
        const notificationBody = `${alert.symbol} is now ${alert.alert_type} $${alert.target_price} (Current: $${currentPrice.toFixed(2)})`;

        // Send push notification
        try {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              user_id: userId,
              title: notificationTitle,
              body: notificationBody,
              data: { symbol: alert.symbol, alert_id: alert.id }
            }
          });
        } catch (err) {
          console.error('Failed to send push notification:', err);
        }

        // Show in-app notification
        toast.success(notificationTitle, { description: notificationBody });

        // Remove from active alerts
        setAlerts(prev => prev.filter(a => a.id !== alert.id));
      }
    }
  };

  const createAlert = async () => {
    if (!symbol || !targetPrice) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      if (!isAuthenticated || !userId) {
        toast.error("Please login to create alerts");
        return;
      }

      const { error } = await supabase
        .from("price_alerts")
        .insert({
          user_id: userId,
          symbol: symbol.toUpperCase(),
          target_price: parseFloat(targetPrice),
          alert_type: alertType,
        });

      if (error) throw error;

      toast.success("Price alert created");
      setSymbol("");
      setTargetPrice("");
      fetchAlerts();
    } catch (error) {
      console.error("Error creating alert:", error);
      toast.error("Failed to create alert");
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from("price_alerts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setAlerts(prev => prev.filter(a => a.id !== id));
      toast.success("Alert deleted");
    } catch (error) {
      console.error("Error deleting alert:", error);
      toast.error("Failed to delete alert");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Price Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create Alert Form */}
        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <div>
            <Label htmlFor="alert-symbol">Stock Symbol</Label>
            <Input
              id="alert-symbol"
              placeholder="e.g., AAPL"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="target-price">Target Price</Label>
              <Input
                id="target-price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="alert-type">Alert When</Label>
              <Select value={alertType} onValueChange={(value: "above" | "below") => setAlertType(value)}>
                <SelectTrigger id="alert-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Price Above</SelectItem>
                  <SelectItem value="below">Price Below</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={createAlert} className="w-full">
            Create Alert
          </Button>
        </div>

        {/* Active Alerts List */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Active Alerts</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active alerts. Create one to get notified when a stock reaches your target price.
            </p>
          ) : (
            alerts.map((alert) => {
              const currentPrice = stockPrices[alert.symbol]?.price;
              return (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm">{alert.symbol}</span>
                      {alert.alert_type === "above" ? (
                        <TrendingUp className="w-4 h-4 text-accent" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Alert when {alert.alert_type} ${alert.target_price.toFixed(2)}
                    </div>
                    {currentPrice && (
                      <div className="text-xs text-muted-foreground">
                        Current: ${currentPrice.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAlert(alert.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceAlerts;
