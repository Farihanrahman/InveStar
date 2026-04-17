import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import GlobalAIAgent from "@/components/GlobalAIAgent"
import { OmsAuthProvider } from "@/lib/auth/omsAuthContext"
import { I18nProvider } from "@/lib/i18n"
import Index from "./pages/Index"
import Dashboard from "./pages/Dashboard"
import Portfolio from "./pages/Portfolio"
import NetWorth from "./pages/NetWorth"
import VirtualTrading from "./pages/VirtualTrading"
import Auth from "./pages/Auth"
import { Navigate } from "react-router-dom"
import MoneyGramRamps from "./pages/MoneyGramRamps"
import Wallet from "./pages/Wallet"
import FundWallet from "./pages/FundWallet"
import Contact from "./pages/Contact"
import Terms from "./pages/Terms"
import Privacy from "./pages/Privacy"
import TestStellar from "./pages/TestStellar"
import Admin from "./pages/Admin"
import Security from "./pages/Security"
import NotFound from "./pages/NotFound"
import InvestorQuiz from "./pages/InvestorQuiz"
import Orders from "./pages/Orders"
import SendMoney from "./pages/SendMoney"
import InveStarAI from "./pages/InveStarAI"
import InveStarRemit from "./pages/InveStarRemit"
import Demo from "./pages/Demo"
import Clawbot from "./pages/Clawbot"
import Traction from "./pages/Traction"
import WalletDemo from "./pages/WalletDemo"

const queryClient = new QueryClient()

const App = () => {
  // usePushNotifications();

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
      <OmsAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/investor-quiz" element={<InvestorQuiz />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/net-worth" element={<NetWorth />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/virtual-trading" element={<VirtualTrading />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/fund-wallet" element={<FundWallet />} />
            <Route path="/ai-coach" element={<Navigate to="/investar-ai" replace />} />
            <Route path="/moneygram-ramps" element={<MoneyGramRamps />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/test-stellar" element={<TestStellar />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/security" element={<Security />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/send-money" element={<SendMoney />} />
            <Route path="/investar-ai" element={<InveStarAI />} />
            <Route path="/remit" element={<InveStarRemit />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/clawbot" element={<Clawbot />} />
            <Route path="/traction" element={<Traction />} />
            <Route path="/wallet/demo" element={<WalletDemo />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
            <GlobalAIAgent />
          </BrowserRouter>
        </TooltipProvider>
      </OmsAuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  )
}

export default App
