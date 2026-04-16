import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, Wallet, BarChart3, Home, Bot, GraduationCap, LogOut, LogIn, 
  Shield, Menu, User, Bell, HelpCircle, FileText, Activity, CreditCard,
  ChevronDown, PieChart, LineChart, Briefcase, ArrowLeft, Send
} from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import investarLogo from "@/assets/investar-logo.png";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useToast } from "@/hooks/use-toast";
import { useLogout } from "@/hooks/api/useAuthApi";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useOmsAuth();
  const { userName, userEmail, userInitial } = useUserInfo();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const logoutMutation = useLogout();
  const { toast } = useToast();
  
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    // Check admin role if user is authenticated
    if (isAuthenticated && user) {
      const userRole = user.role || user.user_role;
      setIsAdmin(userRole === 'admin' || userRole === 'Admin');
    } else {
      setIsAdmin(false);
    }
  }, [isAuthenticated, user]);

  // Investing dropdown items
  const investingItems = [
    { path: "/clawbot", label: "InveStar Agent", icon: Bot },
    { path: "/net-worth", label: "Net Worth", icon: PieChart },
    { path: "/portfolio", label: "Investments", icon: Briefcase },
    { path: "/dashboard", label: "Markets", icon: TrendingUp },
    { path: "/portfolio", label: "Portfolio", icon: LineChart },
    { path: "/virtual-trading", label: "Virtual Trading", icon: BarChart3 },
    { path: "/investar-ai", label: "AI Coach", icon: Bot },
    { 
      href: "https://investarbd.com/learning-platform/?_gl=1*qkzh4k*_ga*NDc0NjYxMzY3LjE3NTUxMzcwODI.*_ga_YT8X7ZGYS3*czE3NjI4OTk1MDkkbzY0JGcwJHQxNzYyODk5NTA5JGo2MCRsMCRoMTI4NTQ3NDA2NA..", 
      label: "InveStar University", 
      icon: GraduationCap,
      external: true
    },
  ];

  // Payments dropdown items
  const paymentsItems = [
    { path: "/remit", label: "InveStar Remit", icon: Send },
    { path: "/wallet", label: "Wallet", icon: Wallet },
    { path: "/fund-wallet", label: "Fund Wallet", icon: CreditCard },
    { path: "/send-money", label: "Send Money", icon: Send },
  ];

  // Home dropdown items
  const homeDropdownItems = [
    { path: "/admin", label: "Admin", icon: Shield, adminOnly: true },
    { path: "/investor-quiz", label: "Profile", icon: User },
    { path: "/security", label: "Security", icon: Shield },
    { path: "/wallet", label: "Accounts", icon: Wallet },
    { path: "/", label: "Notifications", icon: Bell },
    { path: "/contact", label: "Support", icon: HelpCircle },
    { path: "/security", label: "Activity Log", icon: Activity },
  ];

  // Documents dropdown items (Privacy & T&C)
  const documentsItems = [
    { path: "/privacy", label: "Privacy Policy", icon: FileText },
    { path: "/terms", label: "Terms & Conditions", icon: FileText },
  ];

  // Bottom nav items for mobile
  const bottomNavItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/dashboard", label: "Markets", icon: TrendingUp },
    { path: "/portfolio", label: "Portfolio", icon: BarChart3 },
    { path: "/wallet", label: "Wallet", icon: Wallet },
    { path: "/investar-ai", label: "AI", icon: Bot },
  ];

  const handleSignOut = async () => {
    try {
      await logoutMutation.mutateAsync();
      setIsOpen(false);
    } catch (error) {
      // Error handling is done in the logout hook
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Top Navigation - Floating Glassmorphism */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl">
        <div className="bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/20 px-6">
          <div className="flex items-center justify-between h-14">
            {/* Left side: Back Button + Logo + Home Dropdown */}
            <div className="flex items-center gap-2">
              {/* Back Button - shows on all pages except home */}
              {!isHomePage && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate(-1)}
                  className="hover:bg-primary/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              
              <Link to="/" className="flex items-center space-x-3">
                <img src={investarLogo} alt="InveStar Logo" className="h-10 w-auto" />
              </Link>

              {/* Home Dropdown - Desktop */}
              <div className="hidden lg:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <Home className="w-4 h-4" />
                      Home
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 bg-card border-border">
                    {homeDropdownItems.map((item) => {
                      if (item.adminOnly && !isAdmin) return null;
                      const Icon = item.icon;
                      return (
                        <DropdownMenuItem key={item.label} asChild>
                          <Link to={item.path} className="flex items-center gap-2 cursor-pointer">
                            <Icon className="w-4 h-4" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    <p className="px-2 py-1 text-xs text-muted-foreground font-semibold">Documents</p>
                    {documentsItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <DropdownMenuItem key={item.label} asChild>
                          <Link to={item.path} className="flex items-center gap-2 cursor-pointer">
                            <Icon className="w-4 h-4" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    {isAuthenticated ? (
                      <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-destructive">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link to="/auth" className="flex items-center gap-2 cursor-pointer">
                          <LogIn className="w-4 h-4" />
                          Sign In
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Desktop Navigation - Main Tabs */}
            <div className="hidden lg:flex items-center gap-1">
              {/* Investing Dropdown */}
              <NavigationMenu>
                <NavigationMenuList>
                  {/* Remit Dropdown */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Remit
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid gap-1 p-4 w-[220px] bg-card">
                        {paymentsItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.label}
                              to={item.path}
                              className="flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors"
                            >
                              <Icon className="w-5 h-5 text-primary" />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* Investing Dropdown */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Investing
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid gap-1 p-4 w-[280px] bg-card">
                        {investingItems.map((item) => {
                          const Icon = item.icon;
                          if (item.external) {
                            return (
                              <a
                                key={item.label}
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors"
                              >
                                <Icon className="w-5 h-5 text-primary" />
                                <span>{item.label}</span>
                              </a>
                            );
                          }
                          return (
                            <Link
                              key={item.label}
                              to={item.path!}
                              className="flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors"
                            >
                              <Icon className="w-5 h-5 text-primary" />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            {/* Desktop Auth Status + Language Toggle */}
            <div className="hidden lg:flex items-center gap-2">
              <LanguageToggle />
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-sm">
                        {userInitial}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium leading-none">{userName || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{userEmail}</p>
                      </div>
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium">{userName || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{userEmail}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs text-green-600">Signed In</span>
                      </div>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link to="/investor-quiz" className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/wallet" className="flex items-center gap-2 cursor-pointer">
                        <Wallet className="w-4 h-4" />
                        Wallet
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-destructive">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/auth">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
                    <Wallet className="w-4 h-4" />
                    Payments
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                  <p className="px-2 py-1 text-xs text-muted-foreground font-semibold">Connect Wallet</p>
                  <DropdownMenuItem asChild>
                    <Link to="/wallet" className="flex items-center gap-2 cursor-pointer">
                      <Wallet className="w-4 h-4" />
                      My Wallet
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                      <span className="text-base">🦊</span>
                      Freighter (Stellar)
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="https://lobstr.co" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                      <span className="text-base">🦞</span>
                      Lobstr
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="https://xbull.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                      <span className="text-base">🐂</span>
                      xBull
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="https://albedo.link" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                      <span className="text-base">🌟</span>
                      Albedo
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/wallet" className="flex items-center gap-2 cursor-pointer">
                      <Wallet className="w-4 h-4" />
                      My Wallet
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/fund-wallet" className="flex items-center gap-2 cursor-pointer">
                      <CreditCard className="w-4 h-4" />
                      Fund Wallet
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] bg-card overflow-y-auto">
                  <div className="flex flex-col gap-2 mt-6">
                    {/* User Profile Section */}
                    {isAuthenticated && (
                      <div className="flex items-center gap-3 px-3 py-3 border-b border-border mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
                          {userInitial}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{userName || 'User'}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">{userEmail}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-xs text-green-600">Signed In</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Home Section */}
                    <div className="px-3 py-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Home</p>
                      {homeDropdownItems.map((item) => {
                        if (item.adminOnly && !isAdmin) return null;
                        const Icon = item.icon;
                        return (
                          <Link 
                            key={item.label} 
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                          >
                            <Button variant="ghost" className="w-full justify-start gap-3 h-10">
                              <Icon className="w-4 h-4" />
                              {item.label}
                            </Button>
                          </Link>
                        );
                      })}
                      {/* Documents Section */}
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">Documents</p>
                      {documentsItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link 
                            key={item.label} 
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                          >
                            <Button variant="ghost" className="w-full justify-start gap-3 h-10">
                              <Icon className="w-4 h-4" />
                              {item.label}
                            </Button>
                          </Link>
                        );
                      })}
                      
                      {isAuthenticated ? (
                        <Button 
                          variant="ghost"
                          className="w-full justify-start gap-3 h-10 text-destructive hover:text-destructive mt-4"
                          onClick={handleSignOut}
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </Button>
                      ) : (
                        <Link to="/auth" onClick={() => setIsOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-3 h-10 mt-4">
                            <LogIn className="w-4 h-4" />
                            Sign In
                          </Button>
                        </Link>
                      )}
                    </div>

                    {/* Remit Section */}
                    <div className="px-3 py-2 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Remit</p>
                      {paymentsItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link 
                            key={item.label} 
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                          >
                            <Button variant="ghost" className="w-full justify-start gap-3 h-10">
                              <Icon className="w-4 h-4" />
                              {item.label}
                            </Button>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Investing Section */}
                    <div className="px-3 py-2 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Investing</p>
                      {investingItems.map((item) => {
                        const Icon = item.icon;
                        if (item.external) {
                          return (
                            <a 
                              key={item.label} 
                              href={item.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setIsOpen(false)}
                            >
                              <Button variant="ghost" className="w-full justify-start gap-3 h-10">
                                <Icon className="w-4 h-4" />
                                {item.label}
                              </Button>
                            </a>
                          );
                        }
                        return (
                          <Link 
                            key={item.label} 
                            to={item.path!}
                            onClick={() => setIsOpen(false)}
                          >
                            <Button variant="ghost" className="w-full justify-start gap-3 h-10">
                              <Icon className="w-4 h-4" />
                              {item.label}
                            </Button>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Connect Wallet */}
                    <div className="px-3 pt-4 border-t border-border space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Connect Wallet</p>
                      <Button 
                        asChild 
                        className="w-full gap-2 bg-gradient-to-r from-primary to-accent"
                      >
                        <Link to="/wallet" onClick={() => setIsOpen(false)}>
                          <Wallet className="w-4 h-4" />
                          My Wallet
                        </Link>
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" asChild className="gap-1">
                          <a href="https://freighter.app" target="_blank" rel="noopener noreferrer">
                            🦊 Freighter
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="gap-1">
                          <a href="https://lobstr.co" target="_blank" rel="noopener noreferrer">
                            🦞 Lobstr
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="gap-1">
                          <a href="https://xbull.app" target="_blank" rel="noopener noreferrer">
                            🐂 xBull
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="gap-1">
                          <a href="https://albedo.link" target="_blank" rel="noopener noreferrer">
                            🌟 Albedo
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navigation;
