import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, Lock } from "lucide-react";

interface AuthRequiredProps {
  children: React.ReactNode;
  pageName?: string;
}

const AuthRequired = ({ children, pageName = "this feature" }: AuthRequiredProps) => {
  const { isAuthenticated, isLoading } = useOmsAuth();

  // Still loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Not authenticated - show sign in prompt
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Sign In Required</CardTitle>
            <CardDescription className="text-base">
              Please sign in to access {pageName}. Create a free account to track your portfolio, set price alerts, and more.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/auth" className="block">
              <Button className="w-full gap-2" size="lg">
                <LogIn className="w-5 h-5" />
                Sign In
              </Button>
            </Link>
            <Link to="/auth" className="block">
              <Button variant="outline" className="w-full gap-2" size="lg">
                <UserPlus className="w-5 h-5" />
                Create Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated - render children
  return <>{children}</>;
};

export default AuthRequired;
