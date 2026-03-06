import { useState, useEffect } from "react";
import { ArrowRightLeft, Loader2, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";

const CURRENCIES = [
  { code: "BDT", flag: "🇧🇩", name: "Bangladeshi Taka", symbol: "৳" },
  { code: "INR", flag: "🇮🇳", name: "Indian Rupee", symbol: "₹" },
  { code: "PKR", flag: "🇵🇰", name: "Pakistani Rupee", symbol: "₨" },
  { code: "PHP", flag: "🇵🇭", name: "Philippine Peso", symbol: "₱" },
  { code: "NGN", flag: "🇳🇬", name: "Nigerian Naira", symbol: "₦" },
  { code: "GBP", flag: "🇬🇧", name: "British Pound", symbol: "£" },
  { code: "EUR", flag: "🇪🇺", name: "Euro", symbol: "€" },
  { code: "MXN", flag: "🇲🇽", name: "Mexican Peso", symbol: "$" },
  { code: "GHS", flag: "🇬🇭", name: "Ghanaian Cedi", symbol: "₵" },
  { code: "KES", flag: "🇰🇪", name: "Kenyan Shilling", symbol: "KSh" },
];

const FALLBACK_RATES: Record<string, number> = {
  BDT: 121.50, INR: 83.50, PKR: 278.50, PHP: 56.20, NGN: 1550.00,
  GBP: 0.79, EUR: 0.92, MXN: 17.15, GHS: 15.50, KES: 153.00,
};

interface FxRateCalculatorProps {
  onAmountChange?: (usdAmount: string) => void;
  initialAmount?: string;
}

const FxRateCalculator = ({ onAmountChange, initialAmount }: FxRateCalculatorProps) => {
  const [sendAmount, setSendAmount] = useState(initialAmount || "100");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastEdited, setLastEdited] = useState<"send" | "receive">("send");
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = await res.json();
        if (data.result === "success" && data.rates) {
          setRates(data.rates);
        } else {
          setRates(FALLBACK_RATES);
        }
      } catch {
        setRates(FALLBACK_RATES);
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  const currentRate = rates?.[selectedCurrency.code] ?? FALLBACK_RATES[selectedCurrency.code] ?? 1;

  useEffect(() => {
    if (lastEdited === "send") {
      const amt = parseFloat(sendAmount);
      setReceiveAmount(isNaN(amt) || amt <= 0 ? "" : (amt * currentRate).toFixed(2));
    }
  }, [sendAmount, currentRate, lastEdited]);

  useEffect(() => {
    if (lastEdited === "receive") {
      const amt = parseFloat(receiveAmount);
      const usd = isNaN(amt) || amt <= 0 ? "" : (amt / currentRate).toFixed(2);
      setSendAmount(usd);
    }
  }, [receiveAmount, currentRate, lastEdited]);

  const handleSendChange = (val: string) => {
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setSendAmount(val);
      setLastEdited("send");
      onAmountChange?.(val);
    }
  };

  const handleReceiveChange = (val: string) => {
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setReceiveAmount(val);
      setLastEdited("receive");
      const amt = parseFloat(val);
      const usd = isNaN(amt) || amt <= 0 ? "" : (amt / currentRate).toFixed(2);
      onAmountChange?.(usd);
    }
  };

  const handleCurrencySelect = (currency: typeof CURRENCIES[0]) => {
    setSelectedCurrency(currency);
    setShowCurrencyPicker(false);
    // Recalculate receive amount with new rate
    setLastEdited("send");
  };

  return (
    <div className="rounded-xl border border-border bg-background/60 p-4 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium text-foreground">
          🇺🇸 USD
        </span>
        <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
        {/* Currency selector */}
        <div className="relative">
          <button
            onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
            className="flex items-center gap-1.5 font-medium text-foreground px-2 py-1 rounded-lg border border-border hover:bg-accent/10 transition-colors"
          >
            <span>{selectedCurrency.flag}</span>
            <span>{selectedCurrency.code}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {showCurrencyPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowCurrencyPicker(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-popover border border-border rounded-lg shadow-lg py-1 max-h-64 overflow-y-auto">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => handleCurrencySelect(c)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent/10 transition-colors ${
                      selectedCurrency.code === c.code ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                    }`}
                  >
                    <span className="text-base">{c.flag}</span>
                    <span className="font-medium">{c.code}</span>
                    <span className="text-muted-foreground text-xs flex-1 text-right">{c.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <label className="text-xs text-muted-foreground">You send (USD)</label>
          <Input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            value={sendAmount}
            onChange={(e) => handleSendChange(e.target.value)}
            className="h-9 bg-muted/50 border-border"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">They receive ({selectedCurrency.code})</label>
          <Input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            value={receiveAmount}
            placeholder={`${selectedCurrency.symbol} 0.00`}
            onChange={(e) => handleReceiveChange(e.target.value)}
            className="h-9 bg-muted/50 border-border"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
        <span>
          {loading ? (
            <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Fetching rate…</span>
          ) : (
            <>Today's rate: 1 USD = {currentRate.toFixed(2)} {selectedCurrency.code}</>
          )}
        </span>
        <span className="text-accent font-bold text-sm animate-pulse drop-shadow-[0_0_8px_hsl(142_76%_45%/0.8)]">
          ✨ No fees
        </span>
      </div>
    </div>
  );
};

export default FxRateCalculator;
