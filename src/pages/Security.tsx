import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOmsAuth } from '@/lib/auth/omsAuthContext';
import Navigation from '@/components/Navigation';
import AuditLogViewer from '@/components/AuditLogViewer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  Key, 
  Smartphone, 
  Bell, 
  User, 
  Lock,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Security = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading } = useOmsAuth();
  const userEmail = user?.email || null;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 pb-24 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Security Center
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your account security and view activity
          </p>
        </div>

        <div className="grid gap-6">
          {/* Account Status */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{userEmail}</p>
                  <p className="text-sm text-muted-foreground">Primary email</p>
                </div>
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Password</p>
                  <p className="font-medium">Last changed: Unknown</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Account created</p>
                  <p className="font-medium">Recently</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Features */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Features
              </CardTitle>
              <CardDescription>
                Enable additional security measures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Coming Soon
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Device Management</p>
                    <p className="text-sm text-muted-foreground">View and manage connected devices</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Coming Soon
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Security Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified of suspicious activity</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Security Recommendations */}
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-yellow-400">
                <AlertTriangle className="h-5 w-5" />
                Security Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                  <span>Strong password with special characters</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                  <span>AES-256 encryption for wallet keys</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                  <span>Enable two-factor authentication when available</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                  <span>Review your activity log regularly</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <AuditLogViewer />
        </div>
      </main>
    </div>
  );
};

export default Security;