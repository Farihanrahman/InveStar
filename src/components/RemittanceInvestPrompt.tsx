import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RemittanceInvestPromptProps {
  amount: string;
  onSkip: () => void;
  onInvest: (percentage: number, recurring: boolean) => void;
}

const RemittanceInvestPrompt = ({ amount, onSkip, onInvest }: RemittanceInvestPromptProps) => {
  const [selectedPercent, setSelectedPercent] = useState<number | null>(null);
  const [customPercent, setCustomPercent] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const { toast } = useToast();

  const presetOptions = [1, 5, 10];
  const parsedAmount = parseFloat(amount) || 0;

  const activePercent = selectedPercent === -1 ? parseFloat(customPercent) || 0 : selectedPercent || 0;
  const investAmount = (parsedAmount * activePercent / 100).toFixed(2);

  const handleConfirm = () => {
    if (activePercent <= 0 || activePercent > 50) {
      toast({
        title: "Invalid percentage",
        description: "Please select between 1% and 50%.",
        variant: "destructive",
      });
      return;
    }
    onInvest(activePercent, isRecurring);
  };

  return (
    <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-full bg-accent/20">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          Build Wealth From Every Remittance
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Want to invest a portion of your ${parsedAmount.toFixed(2)} transfer to grow your wealth over time?
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Percentage Options */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Choose investment percentage</Label>
          <div className="grid grid-cols-4 gap-2">
            {presetOptions.map((pct) => (
              <Button
                key={pct}
                type="button"
                variant={selectedPercent === pct ? "default" : "outline"}
                className={`h-12 text-base font-semibold transition-all ${
                  selectedPercent === pct
                    ? "bg-gradient-to-r from-accent to-primary text-white shadow-lg scale-105"
                    : "hover:border-accent/50"
                }`}
                onClick={() => { setSelectedPercent(pct); setCustomPercent(""); }}
              >
                {pct}%
              </Button>
            ))}
            <Button
              type="button"
              variant={selectedPercent === -1 ? "default" : "outline"}
              className={`h-12 text-sm font-semibold transition-all ${
                selectedPercent === -1
                  ? "bg-gradient-to-r from-accent to-primary text-white shadow-lg scale-105"
                  : "hover:border-accent/50"
              }`}
              onClick={() => setSelectedPercent(-1)}
            >
              Custom
            </Button>
          </div>
        </div>

        {/* Custom Input */}
        {selectedPercent === -1 && (
          <div className="flex items-center gap-2 animate-in fade-in duration-300">
            <Input
              type="number"
              placeholder="Enter %"
              value={customPercent}
              onChange={(e) => setCustomPercent(e.target.value)}
              className="w-24 h-10"
              min={1}
              max={50}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        )}

        {/* Investment Preview */}
        {activePercent > 0 && (
          <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">Investment Amount</span>
              </div>
              <span className="text-lg font-bold text-accent">${investAmount}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ${(parsedAmount - parseFloat(investAmount)).toFixed(2)} will be sent to recipient
            </p>
          </div>
        )}

        {/* Recurring Checkbox */}
        <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:border-accent/30 transition-colors cursor-pointer"
          onClick={() => setIsRecurring(!isRecurring)}
        >
          <Checkbox
            id="recurring"
            checked={isRecurring}
            onCheckedChange={(checked) => setIsRecurring(!!checked)}
          />
          <div>
            <Label htmlFor="recurring" className="text-sm font-medium cursor-pointer">
              Make this recurring
            </Label>
            <p className="text-xs text-muted-foreground">
              Automatically invest {activePercent > 0 ? `${activePercent}%` : "this percentage"} on every future remittance
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onSkip}
          >
            Skip
          </Button>
          <Button
            className="flex-1 gap-2 bg-gradient-to-r from-accent to-primary hover:opacity-90"
            onClick={handleConfirm}
            disabled={activePercent <= 0}
          >
            Invest & Send <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RemittanceInvestPrompt;
