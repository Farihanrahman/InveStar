import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { TrendingUp, ArrowLeft, Eye, EyeOff, Check, X } from "lucide-react";
import { signUpSchema, signInSchema, getPasswordStrength } from "@/lib/validation";
import { z } from "zod";
import { useLogin } from "@/hooks/api/useAuthApi";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";
import { supabase } from "@/integrations/supabase/client";

const OMS_OVERRIDE_KEY = "OMS_API_BASE_URL_OVERRIDE";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const { setAuth, isAuthenticated, isLoading } = useOmsAuth();

  const [omsBaseUrlOverride, setOmsBaseUrlOverride] = useState("");
  const [showOmsSettings, setShowOmsSettings] = useState(false);

  const [isNewUser, setIsNewUser] = useState(false);
  const passwordStrength = getPasswordStrength(password);

  useEffect(() => {
    // Allow runtime override for when tunnel URLs change
    const stored = localStorage.getItem(OMS_OVERRIDE_KEY);
    const fallback = import.meta.env.VITE_OMS_API_BASE_URL || "";
    setOmsBaseUrlOverride(stored ?? fallback);
  }, []);

  const saveOmsOverride = () => {
    const trimmed = omsBaseUrlOverride.trim();
    if (trimmed) {
      localStorage.setItem(OMS_OVERRIDE_KEY, trimmed);
      toast({
        title: "OMS URL saved",
        description: "Try signing in again.",
      });
    } else {
      localStorage.removeItem(OMS_OVERRIDE_KEY);
      toast({
        title: "OMS URL cleared",
        description: "Using the default configured OMS URL.",
      });
    }
  };

  const resetOmsOverride = () => {
    const fallback = import.meta.env.VITE_OMS_API_BASE_URL || "";
    localStorage.removeItem(OMS_OVERRIDE_KEY);
    setOmsBaseUrlOverride(fallback);
    toast({
      title: "OMS URL reset",
      description: "Using the default configured OMS URL.",
    });
  };
  // Password requirements check (updated for 12+ chars and special char)
  const passwordChecks = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };

  useEffect(() => {
    // Check if user is already authenticated with OMS
    if (!isLoading && isAuthenticated) {
      navigate("/wallet");
    }
  }, [navigate, isAuthenticated, isLoading]);

  // Listen for Google OAuth callback via Supabase auth state
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const googleUser = {
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name,
          name: session.user.user_metadata?.name,
          avatar_url: session.user.user_metadata?.avatar_url,
        };
        setAuth(session.access_token, googleUser as any, "google");
        toast({
          title: "Welcome!",
          description: "Successfully signed in with Google.",
        });
        navigate("/wallet");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, setAuth]);

  const validateForm = (isSignUp: boolean): boolean => {
    setErrors({});

    try {
      if (isSignUp) {
        signUpSchema.parse({ email, password });
      } else {
        signInSchema.parse({ email, password });
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.issues.forEach((issue) => {
          if (issue.path[0] === "email") {
            fieldErrors.email = issue.message;
          } else if (issue.path[0] === "password") {
            fieldErrors.password = issue.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm(true)) {
      return;
    }

    // Signup will be handled separately as per user request
    toast({
      title: "Coming Soon",
      description: "Account registration will be available soon. Please contact support for account creation.",
      variant: "default",
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm(false)) {
      return;
    }

    try {
      const responseData = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      });

      if (responseData) {
        // Extract token from session.access_token and user from user_info
        const token = responseData?.session?.access_token;
        const userInfo = responseData?.user_info as Record<string, unknown> | undefined;

        if (token && userInfo) {
          // Get tenant info if available
          const tenants = userInfo.tenants as Array<{ id?: number | string }> | undefined;
          const tenantId = tenants?.[0]?.id;

          // Map user_info to OmsUser format
          const user: Record<string, unknown> = {
            id: String(userInfo.id ?? ""),
            email: userInfo.email as string | undefined,
            first_name: userInfo.first_name as string | undefined,
            last_name: userInfo.last_name as string | undefined,
            user_name: userInfo.user_name as string | undefined,
            name: `${userInfo.first_name ?? ""} ${userInfo.last_name ?? ""}`.trim(),
            full_name: `${userInfo.first_name ?? ""} ${userInfo.last_name ?? ""}`.trim(),
            role: userInfo.role as string | undefined,
            senderSubId: userInfo.senderSubId as string | undefined,
            tenant_id: tenantId ? String(tenantId) : undefined,
            ...userInfo,
          };

          // Update auth context with token and user data
          setAuth(token, user as any);
        } else {
          console.error("Login response missing token or user:", responseData);
          toast({
            title: "Login incomplete",
            description: "Received incomplete login response. Please try again.",
            variant: "destructive",
          });
          return;
        }

        if (!rememberMe) {
          sessionStorage.setItem("temp_session", "true");
        }
        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
        // Navigate after successful login
        navigate("/wallet");
      }
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      let showOmsHint = false;

      const rawMessage = String(error?.response?.data?.message || error?.message || "").toLowerCase();

      const isDnsOrNetworkError =
        error?.code === "ERR_NETWORK" ||
        rawMessage.includes("dns error") ||
        rawMessage.includes("failed to lookup") ||
        rawMessage.includes("unreachable");

      if (isDnsOrNetworkError) {
        errorMessage =
          "Cannot reach OMS server. The tunnel URL may have changed — open 'OMS server settings' below and paste the new URL.";
        showOmsHint = true;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Auto-expand OMS settings so user can fix the URL
      if (showOmsHint) {
        setShowOmsSettings(true);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/wallet`,
        },
      });

      if (error) {
        throw error;
      }
      // OAuth redirects to Google, then callback; session handled by onAuthStateChange
    } catch (error) {
      toast({
        title: "Google Sign-In Error",
        description: "Unable to initiate Google sign-in. Please try again.",
        variant: "destructive",
      });
    }
  };

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-xs ${met ? "text-green-500" : "text-muted-foreground"}`}>
      {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      {text}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              InveStar
            </span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Welcome</h2>
          <p className="text-muted-foreground mt-2">Sign in or create an account to manage your wallet</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Sign in to access your wallet</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      className={errors.email ? "border-red-500" : ""}
                      required
                    />
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setErrors((prev) => ({ ...prev, password: undefined }));
                        }}
                        className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-signin"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label htmlFor="remember-signin" className="text-sm font-normal cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={loginMutation.isPending}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Sign in with Google
                  </Button>

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-between"
                      onClick={() => setShowOmsSettings((v) => !v)}
                    >
                      OMS server settings
                      <span className="text-xs text-muted-foreground">{showOmsSettings ? "Hide" : "Show"}</span>
                    </Button>

                    {showOmsSettings && (
                      <div className="mt-2 space-y-2 rounded-md border p-3">
                        <div className="space-y-2">
                          <Label htmlFor="oms-base-url" className="text-xs">
                            OMS API URL (host or full URL)
                          </Label>
                          <Input
                            id="oms-base-url"
                            placeholder="example.trycloudflare.com"
                            value={omsBaseUrlOverride}
                            onChange={(e) => setOmsBaseUrlOverride(e.target.value)}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button type="button" variant="outline" className="flex-1" onClick={saveOmsOverride}>
                            Save
                          </Button>
                          <Button type="button" variant="outline" className="flex-1" onClick={resetOmsOverride}>
                            Reset
                          </Button>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          If your OMS tunnel URL changes, paste the new URL here, press Save, then try signing in again.
                        </p>
                      </div>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Start managing your crypto wallet</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      className={errors.email ? "border-red-500" : ""}
                      required
                    />
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setErrors((prev) => ({ ...prev, password: undefined }));
                        }}
                        className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}

                    {/* Password strength indicator */}
                    {password && (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                passwordStrength.score <= 2
                                  ? "bg-red-500 w-1/3"
                                  : passwordStrength.score <= 4
                                    ? "bg-yellow-500 w-2/3"
                                    : "bg-green-500 w-full"
                              }`}
                            />
                          </div>
                          <span className={`text-xs font-medium ${passwordStrength.color}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <PasswordRequirement met={passwordChecks.length} text="12+ characters" />
                          <PasswordRequirement met={passwordChecks.uppercase} text="Uppercase letter" />
                          <PasswordRequirement met={passwordChecks.lowercase} text="Lowercase letter" />
                          <PasswordRequirement met={passwordChecks.number} text="Number" />
                          <PasswordRequirement met={passwordChecks.special} text="Special char (!@#$...)" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-signup"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label htmlFor="remember-signup" className="text-sm font-normal cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <Button type="submit" className="w-full" disabled>
                    Sign Up (Coming Soon)
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                  <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Sign up with Google (Coming Soon)
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
