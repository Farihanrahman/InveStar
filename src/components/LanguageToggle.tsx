import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const LanguageToggle = ({ compact = false }: { compact?: boolean }) => {
  const { lang, toggleLang } = useI18n();

  return (
    <Button
      variant="ghost"
      size={compact ? "icon" : "sm"}
      onClick={toggleLang}
      className="gap-1.5 text-xs font-medium"
      title={lang === "en" ? "বাংলায় দেখুন" : "Switch to English"}
    >
      <Globe className="w-4 h-4" />
      {!compact && (lang === "en" ? "বাংলা" : "EN")}
    </Button>
  );
};

export default LanguageToggle;
