import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, Calendar, Mail, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  role: string;
}

interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  source: string;
  status: string;
  created_at: string;
}

const Admin = () => {
  const { isAuthenticated, user: omsUser, isLoading: authLoading } = useOmsAuth();
  const userId = omsUser?.id?.toString() || null;
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'waitlist'>('users');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    checkAdminAccess();
  }, [navigate, isAuthenticated, authLoading, userId]);

  const checkAdminAccess = async () => {
    if (!userId) return;
    
    try {
      // Check if user has admin role
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) throw error;

      if (!roles || roles.length === 0) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      fetchUsers();
      fetchWaitlist();
    } catch (error) {
      console.error('Admin access check error:', error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    }
  };

  const fetchWaitlist = async () => {
    try {
      const { data, error } = await supabase
        .from('waitlist' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWaitlist((data as any) || []);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage users and monitor platform activity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                Total registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => {
                  const today = new Date();
                  const created = new Date(u.created_at);
                  return created.toDateString() === today.toDateString();
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Users registered today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  const created = new Date(u.created_at);
                  return created >= weekAgo;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Users in the last 7 days
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
            className="gap-2"
          >
            <Users className="w-4 h-4" /> Users ({users.length})
          </Button>
          <Button
            variant={activeTab === 'waitlist' ? 'default' : 'outline'}
            onClick={() => { setActiveTab('waitlist'); fetchWaitlist(); }}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" /> Waitlist ({waitlist.length})
          </Button>
        </div>

        {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>User Signups</CardTitle>
            <CardDescription>View and manage all registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Button onClick={fetchUsers} variant="outline">Refresh</Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No users found</TableCell></TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{format(new Date(user.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{format(new Date(user.updated_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell><Badge variant="secondary">Active</Badge></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        )}

        {activeTab === 'waitlist' && (
        <Card>
          <CardHeader>
            <CardTitle>Waitlist Signups</CardTitle>
            <CardDescription>People who signed up to join the waitlist</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-6">
              <Button onClick={fetchWaitlist} variant="outline">Refresh</Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Signed Up</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waitlist.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No waitlist signups yet</TableCell></TableRow>
                  ) : (
                    waitlist.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.email}</TableCell>
                        <TableCell>{entry.source}</TableCell>
                        <TableCell><Badge variant={entry.status === 'pending' ? 'secondary' : 'default'}>{entry.status}</Badge></TableCell>
                        <TableCell>{format(new Date(entry.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
};

export default Admin;
