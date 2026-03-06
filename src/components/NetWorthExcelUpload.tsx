import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileSpreadsheet, Check, AlertCircle, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ParsedAsset {
  name: string;
  type: string;
  subCategory?: string;
  value: number;
}

interface NetWorthExcelUploadProps {
  userId: string;
  onUploadComplete: () => void;
}

const ASSET_TYPE_MAPPING: Record<string, string> = {
  "stocks": "stocks",
  "stock": "stocks",
  "investment": "stocks",
  "investments": "stocks",
  "savings": "savings",
  "saving": "savings",
  "fixed deposit": "savings",
  "fd": "savings",
  "bank": "savings",
  "property": "property",
  "real estate": "property",
  "house": "property",
  "land": "property",
  "retirement": "retirement",
  "401k": "retirement",
  "pension": "retirement",
  "crypto": "crypto",
  "cryptocurrency": "crypto",
  "bitcoin": "crypto",
  "vehicle": "vehicle",
  "car": "vehicle",
  "bike": "vehicle",
  "business": "business",
  "other": "other",
};

const getIconForType = (type: string): string => {
  switch (type) {
    case "stocks": return "trending";
    case "savings": return "piggy";
    case "property": return "home";
    case "retirement": return "building";
    case "crypto": return "crypto";
    case "vehicle": return "vehicle";
    case "business": return "business";
    default: return "wallet";
  }
};

const normalizeType = (rawType: string): string => {
  const lower = rawType.toLowerCase().trim();
  return ASSET_TYPE_MAPPING[lower] || "other";
};

const NetWorthExcelUpload = ({ userId, onUploadComplete }: NetWorthExcelUploadProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [parsedAssets, setParsedAssets] = useState<ParsedAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setParsedAssets([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as (string | number)[][];

      if (jsonData.length < 2) {
        setError("File must have at least a header row and one data row");
        return;
      }

      // Find column indices
      const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
      const nameIdx = headers.findIndex(h => h.includes("name") || h.includes("asset"));
      const typeIdx = headers.findIndex(h => h.includes("type") || h.includes("category"));
      const valueIdx = headers.findIndex(h => h.includes("value") || h.includes("amount") || h.includes("balance"));
      const subCatIdx = headers.findIndex(h => h.includes("sub") || h.includes("detail"));

      if (nameIdx === -1 || valueIdx === -1) {
        setError("File must have 'Name' and 'Value' columns. Optional: 'Type', 'SubCategory'");
        return;
      }

      const assets: ParsedAsset[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        const name = String(row[nameIdx] || "").trim();
        const rawType = typeIdx !== -1 ? String(row[typeIdx] || "other") : "other";
        const value = parseFloat(String(row[valueIdx] || "0"));
        const subCategory = subCatIdx !== -1 ? String(row[subCatIdx] || "") : undefined;

        if (name && !isNaN(value) && value > 0) {
          assets.push({
            name: subCategory ? `${name} (${subCategory})` : name,
            type: normalizeType(rawType),
            subCategory,
            value,
          });
        }
      }

      if (assets.length === 0) {
        setError("No valid assets found in the file");
        return;
      }

      setParsedAssets(assets);
    } catch {
      setError("Failed to parse file. Please ensure it's a valid Excel or CSV file.");
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImport = async () => {
    if (parsedAssets.length === 0) return;
    setIsUploading(true);

    try {
      const inserts = parsedAssets.map(asset => ({
        user_id: userId,
        name: asset.name,
        type: asset.type,
        value: asset.value,
        icon: getIconForType(asset.type),
      }));

      const { error } = await supabase.from("net_worth_assets").insert(inserts);
      if (error) throw error;

      toast.success(`Imported ${parsedAssets.length} assets successfully!`);
      setParsedAssets([]);
      setIsOpen(false);
      onUploadComplete();
    } catch {
      toast.error("Failed to import assets");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      ["Name", "Type", "SubCategory", "Value"],
      ["My Savings Account", "Savings", "Fixed Deposit", 50000],
      ["Emergency Fund", "Savings", "Cash", 10000],
      ["Stock Portfolio", "Stocks", "US Stocks", 25000],
      ["Bitcoin Holdings", "Crypto", "BTC", 5000],
      ["House", "Property", "Primary Residence", 200000],
      ["Car", "Vehicle", "Toyota Corolla", 15000],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Net Worth");
    XLSX.writeFile(wb, "net-worth-template.xlsx");
  };

  const totalValue = parsedAssets.reduce((sum, a) => sum + a.value, 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="w-4 h-4" />
          Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Import from Excel/CSV
          </DialogTitle>
          <DialogDescription>
            Upload your net worth spreadsheet to quickly add multiple assets.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1">
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </div>

          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="excel-upload"
              />
              <label
                htmlFor="excel-upload"
                className="flex flex-col items-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              >
                <Upload className="w-10 h-10 mb-2" />
                <span className="text-sm font-medium">Click to upload Excel or CSV</span>
                <span className="text-xs mt-1">Supports .xlsx, .xls, .csv</span>
              </label>
            </CardContent>
          </Card>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {parsedAssets.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Found {parsedAssets.length} assets</span>
                <span className="font-semibold">
                  Total: ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1">
                {parsedAssets.map((asset, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                    <div>
                      <span className="font-medium">{asset.name}</span>
                      <span className="text-xs text-muted-foreground ml-2 capitalize">({asset.type})</span>
                    </div>
                    <span className="font-semibold">${asset.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <Button onClick={handleImport} disabled={isUploading} className="w-full gap-2">
                <Check className="w-4 h-4" />
                {isUploading ? "Importing..." : `Import ${parsedAssets.length} Assets`}
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Required columns: <strong>Name</strong>, <strong>Value</strong><br />
            Optional: Type (Stocks, Savings, Property, Crypto, Vehicle, Business), SubCategory
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NetWorthExcelUpload;
