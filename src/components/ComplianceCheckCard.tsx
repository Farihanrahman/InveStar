import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface ComplianceResult {
  allowed: boolean | string;
  reason: string;
  limits?: string;
  warning?: string;
}

interface ComplianceCheckCardProps {
  action: string;
  userType: "resident" | "nrb";
  amount?: number;
}

const rules: Record<string, Record<string, ComplianceResult>> = {
  "send_abroad": {
    resident: {
      allowed: true,
      reason: "Outward remittance for family support is permitted. Investment remittance requires Bangladesh Bank approval.",
      limits: "$12,000/year for education/medical. Family support within authorized dealer limits.",
    },
    nrb: {
      allowed: true,
      reason: "NRBs can freely transfer funds. Inward remittance to Bangladesh is encouraged and tax-free.",
      limits: "No limit on inward remittance",
    },
  },
  "invest_dse": {
    resident: { allowed: true, reason: "Freely permitted via any BSEC-registered broker with a BO account.", limits: "No limit" },
    nrb: { allowed: true, reason: "Invest via NITA account through an Authorized Dealer bank. Dividends and capital gains are fully repatriable.", limits: "No limit" },
  },
  "invest_us_stocks": {
    resident: { allowed: false, reason: "Bangladesh Bank does not permit residents to directly invest in foreign stock markets.", limits: "N/A", warning: "Consider DSE-listed multinational stocks as alternatives." },
    nrb: { allowed: true, reason: "As an NRB, you can invest using foreign-earned income. No Bangladesh Bank approval needed.", limits: "No specific limit" },
  },
  "crypto": {
    resident: { allowed: false, reason: "Bangladesh Bank has NOT approved cryptocurrency trading. BFIU actively monitors crypto transactions.", limits: "N/A", warning: "⚠️ Engaging in crypto from Bangladesh carries legal risk." },
    nrb: { allowed: "grey_area" as any, reason: "BD regulations don't apply to foreign residence, but repatriating gains may trigger BFIU scrutiny.", limits: "N/A" },
  },
};

const ComplianceCheckCard = ({ action, userType, amount }: ComplianceCheckCardProps) => {
  const rule = rules[action]?.[userType];
  if (!rule) return null;

  const statusIcon = rule.allowed === true
    ? <CheckCircle2 className="w-5 h-5 text-green-500" />
    : rule.allowed === false
    ? <XCircle className="w-5 h-5 text-red-500" />
    : <AlertTriangle className="w-5 h-5 text-yellow-500" />;

  const statusLabel = rule.allowed === true ? "Allowed" : rule.allowed === false ? "Not Allowed" : "Proceed with Caution";
  const statusColor = rule.allowed === true ? "bg-green-500/10 text-green-500 border-green-500/30" : rule.allowed === false ? "bg-red-500/10 text-red-500 border-red-500/30" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="w-4 h-4 text-primary" />
          BD Compliance Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          {statusIcon}
          <Badge variant="outline" className={statusColor}>{statusLabel}</Badge>
          <Badge variant="secondary" className="text-xs">{userType === "nrb" ? "NRB" : "BD Resident"}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{rule.reason}</p>
        {rule.limits && (
          <p className="text-xs text-muted-foreground">
            <strong>Limits:</strong> {rule.limits}
          </p>
        )}
        {rule.warning && (
          <p className="text-xs text-yellow-500 font-medium">{rule.warning}</p>
        )}
        <p className="text-[10px] text-muted-foreground/60 italic">
          Informational only — not legal advice. Verify with Bangladesh Bank or BSEC.
        </p>
      </CardContent>
    </Card>
  );
};

export default ComplianceCheckCard;
