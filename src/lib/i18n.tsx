import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type Language = "en" | "bn";

const translations: Record<string, Record<Language, string>> = {
  // Navigation
  "nav.home": { en: "Home", bn: "হোম" },
  "nav.portfolio": { en: "Portfolio", bn: "পোর্টফোলিও" },
  "nav.wallet": { en: "Wallet", bn: "ওয়ালেট" },
  "nav.markets": { en: "Markets", bn: "বাজার" },
  "nav.send_money": { en: "Send Money", bn: "টাকা পাঠান" },
  "nav.ai_coach": { en: "AI Coach", bn: "এআই কোচ" },
  "nav.login": { en: "Sign In", bn: "সাইন ইন" },
  "nav.logout": { en: "Sign Out", bn: "সাইন আউট" },

  // Hero
  "hero.title": { en: "InveStar: Build Wealth From Every Cross-Border Payment", bn: "ইনভেস্টার: প্রতিটি আন্তর্জাতিক পেমেন্ট থেকে সম্পদ গড়ুন" },
  "hero.subtitle": { en: "Global Payments to Smart Investing.", bn: "বৈশ্বিক পেমেন্ট থেকে স্মার্ট বিনিয়োগ।" },
  "hero.send_money": { en: "Send Money", bn: "টাকা পাঠান" },
  "hero.start_investing": { en: "Start Investing", bn: "বিনিয়োগ শুরু করুন" },
  "hero.try_demo": { en: "Try Demo", bn: "ডেমো দেখুন" },
  "hero.waitlist_cta": { en: "Be the first to know when new features drop:", bn: "নতুন ফিচার আসলে সবার আগে জানুন:" },

  // Home sections
  "home.remit": { en: "Remit", bn: "রেমিট" },
  "home.investments": { en: "Investments", bn: "বিনিয়োগ" },
  "home.my_wallet": { en: "My Wallet", bn: "আমার ওয়ালেট" },
  "home.fund_wallet": { en: "Fund Wallet", bn: "ওয়ালেট ফান্ড করুন" },
  "home.virtual_trading": { en: "Virtual Trading", bn: "ভার্চুয়াল ট্রেডিং" },
  "home.net_worth": { en: "Net Worth", bn: "নেট ওয়ার্থ" },
  "home.latest_news": { en: "Latest News", bn: "সর্বশেষ সংবাদ" },
  "home.features_title": { en: "Everything You Need to Succeed", bn: "সফল হতে আপনার যা দরকার" },
  "home.features_subtitle": { en: "Powerful AI-driven features designed for modern investors", bn: "আধুনিক বিনিয়োগকারীদের জন্য এআই-চালিত শক্তিশালী ফিচার" },
  "home.cta_title": { en: "Ready to Start Investing?", bn: "বিনিয়োগ শুরু করতে প্রস্তুত?" },
  "home.cta_subtitle": { en: "Join thousands of investors already using InveStar", bn: "হাজারো বিনিয়োগকারী ইতিমধ্যে ইনভেস্টার ব্যবহার করছেন" },
  "home.get_started": { en: "Get Started Now", bn: "এখনই শুরু করুন" },

  // Features
  "feature.real_time_trading": { en: "Real-Time Trading", bn: "রিয়েল-টাইম ট্রেডিং" },
  "feature.real_time_trading_desc": { en: "Access live market data and execute trades instantly with our advanced trading platform.", bn: "আমাদের উন্নত ট্রেডিং প্ল্যাটফর্মে লাইভ মার্কেট ডেটা এবং তাৎক্ষণিক ট্রেড করুন।" },
  "feature.integrated_wallet": { en: "Integrated Wallet", bn: "ইন্টিগ্রেটেড ওয়ালেট" },
  "feature.integrated_wallet_desc": { en: "Seamlessly connect your wallet and manage all your assets in one secure place.", bn: "আপনার ওয়ালেট সংযুক্ত করুন এবং সব সম্পদ এক নিরাপদ জায়গায় পরিচালনা করুন।" },
  "feature.portfolio_analytics": { en: "Portfolio Analytics", bn: "পোর্টফোলিও বিশ্লেষণ" },
  "feature.portfolio_analytics_desc": { en: "Track your investments with detailed analytics and performance metrics.", bn: "বিস্তারিত বিশ্লেষণ ও পারফরম্যান্স মেট্রিক্স দিয়ে আপনার বিনিয়োগ ট্র্যাক করুন।" },
  "feature.bank_security": { en: "Bank-Level Security", bn: "ব্যাংক-পর্যায়ের নিরাপত্তা" },
  "feature.bank_security_desc": { en: "Your investments are protected with enterprise-grade security and encryption.", bn: "আপনার বিনিয়োগ এন্টারপ্রাইজ-গ্রেড নিরাপত্তা ও এনক্রিপশন দ্বারা সুরক্ষিত।" },
  "feature.lightning_fast": { en: "Lightning Fast", bn: "বিদ্যুৎগতি" },
  "feature.lightning_fast_desc": { en: "Execute trades in milliseconds with our optimized trading infrastructure.", bn: "আমাদের অপটিমাইজড ইনফ্রাস্ট্রাকচারে মিলিসেকেন্ডে ট্রেড করুন।" },
  "feature.expert_insights": { en: "Expert Insights", bn: "বিশেষজ্ঞ পরামর্শ" },
  "feature.expert_insights_desc": { en: "Get market insights and analysis to make informed investment decisions.", bn: "সচেতন বিনিয়োগ সিদ্ধান্তের জন্য মার্কেট ইনসাইট ও বিশ্লেষণ পান।" },

  // Send Money
  "send.title": { en: "Send Money", bn: "টাকা পাঠান" },
  "send.choose_method": { en: "Choose Payment Method", bn: "পেমেন্ট পদ্ধতি বাছাই করুন" },
  "send.amount": { en: "Amount", bn: "পরিমাণ" },
  "send.recipient": { en: "Recipient", bn: "প্রাপক" },
  "send.compliance_check": { en: "Compliance Check", bn: "কমপ্লায়েন্স চেক" },
  "send.fee_comparison": { en: "Fee Comparison", bn: "ফি তুলনা" },
  "send.best_rate": { en: "Best Rate", bn: "সেরা রেট" },
  "send.proceed": { en: "Proceed", bn: "এগিয়ে যান" },

  // Copilot
  "copilot.title": { en: "InveStar AI Coach", bn: "ইনভেস্টার এআই কোচ" },
  "copilot.subtitle": { en: "AI-powered trade suggestions • BD compliance checks • Portfolio analysis", bn: "এআই ট্রেড সাজেশন • বিডি কমপ্লায়েন্স চেক • পোর্টফোলিও বিশ্লেষণ" },
  "copilot.trade_ideas": { en: "Trade Ideas", bn: "ট্রেড আইডিয়া" },
  "copilot.bd_rules": { en: "BD Rules", bn: "বিডি নিয়ম" },
  "copilot.my_portfolio": { en: "My Portfolio", bn: "আমার পোর্টফোলিও" },
  "copilot.dse_analysis": { en: "DSE Analysis", bn: "ডিএসই বিশ্লেষণ" },
  "copilot.nrb_investing": { en: "NRB Investing", bn: "এনআরবি বিনিয়োগ" },

  // Common
  "common.loading": { en: "Loading...", bn: "লোড হচ্ছে..." },
  "common.error": { en: "Something went wrong", bn: "কিছু ভুল হয়েছে" },
  "common.cancel": { en: "Cancel", bn: "বাতিল" },
  "common.confirm": { en: "Confirm", bn: "নিশ্চিত করুন" },
  "common.back": { en: "Back", bn: "পেছনে" },
  "common.next": { en: "Next", bn: "পরবর্তী" },
  "common.learn_more": { en: "Learn More", bn: "আরও জানুন" },
};

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (key: string) => key,
  toggleLang: () => {},
});

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("investar_lang");
    return (saved === "bn" ? "bn" : "en") as Language;
  });

  const handleSetLang = useCallback((newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("investar_lang", newLang);
  }, []);

  const toggleLang = useCallback(() => {
    handleSetLang(lang === "en" ? "bn" : "en");
  }, [lang, handleSetLang]);

  const t = useCallback((key: string): string => {
    return translations[key]?.[lang] || key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang: handleSetLang, t, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);

export default I18nContext;
