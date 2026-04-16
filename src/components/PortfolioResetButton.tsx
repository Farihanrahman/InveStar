import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PortfolioResetButtonProps {
  onReset: () => void;
}

const PortfolioResetButton = ({ onReset }: PortfolioResetButtonProps) => {
  const handleReset = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please login to reset portfolio");
        return;
      }

      // Delete all trades
      const { error: tradesError } = await supabase
        .from("virtual_trades")
        .delete()
        .eq("user_id", session.user.id);

      if (tradesError) throw tradesError;

      // Delete all orders
      const { error: ordersError } = await supabase
        .from("virtual_orders")
        .delete()
        .eq("user_id", session.user.id);

      if (ordersError) throw ordersError;

      // Reset portfolio balance to $10,000
      const { error: portfolioError } = await supabase
        .from("virtual_portfolios")
        .update({ virtual_balance: 1000000.00 })
        .eq("user_id", session.user.id);

      if (portfolioError) throw portfolioError;

      // Delete all price alerts
      const { error: alertsError } = await supabase
        .from("price_alerts")
        .delete()
        .eq("user_id", session.user.id);

      if (alertsError) throw alertsError;

      toast.success("Portfolio reset to $1,000,000", {
        description: "All trades, orders, and alerts have been cleared.",
      });

      // Trigger reload
      onReset();
    } catch (error) {
      console.error("Error resetting portfolio:", error);
      toast.error("Failed to reset portfolio");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Reset Portfolio
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Virtual Portfolio?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all your virtual trades, orders, and alerts,
            and reset your balance back to $1,000,000. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Reset Portfolio
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PortfolioResetButton;
