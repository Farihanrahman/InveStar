import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Clock, MapPin, Monitor, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  action_type: string;
  details: unknown;
  ip_address: unknown;
  user_agent: string | null;
  created_at: string;
}

const ACTION_TYPE_COLORS: Record<string, string> = {
  auth: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  wallet: 'bg-green-500/20 text-green-400 border-green-500/30',
  trading: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  settings: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  security: 'bg-red-500/20 text-red-400 border-red-500/30',
  admin: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  navigation: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const AuditLogViewer = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('action_type', filter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setLogs(data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const parseUserAgent = (ua: string | null): string => {
    if (!ua) return 'Unknown device';
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('iPad')) return 'iPad';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Mac')) return 'Mac';
    if (ua.includes('Linux')) return 'Linux';
    return 'Unknown device';
  };

  const formatIpAddress = (ip: unknown): string => {
    if (!ip || typeof ip !== 'string') return 'Unknown';
    // Mask part of IP for privacy
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }
    return ip.substring(0, 10) + '...';
  };

  const getDetailsObject = (details: unknown): Record<string, unknown> => {
    if (details && typeof details === 'object' && !Array.isArray(details)) {
      return details as Record<string, unknown>;
    }
    return {};
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Activity Log
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="wallet">Wallet</SelectItem>
                <SelectItem value="trading">Trading</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9 shrink-0"
              onClick={fetchLogs}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{error}</p>
            <Button variant="link" onClick={fetchLogs} className="mt-2">
              Try again
            </Button>
          </div>
        ) : logs.length === 0 && !loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No activity recorded yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant="outline" 
                        className={`${ACTION_TYPE_COLORS[log.action_type] || ACTION_TYPE_COLORS.navigation} text-xs`}
                      >
                        {log.action_type}
                      </Badge>
                      <span className="font-medium text-sm">{log.action}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(log.created_at), 'MMM d, h:mm a')}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {log.ip_address && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {formatIpAddress(log.ip_address)}
                      </div>
                    )}
                    {log.user_agent && (
                      <div className="flex items-center gap-1">
                        <Monitor className="h-3 w-3" />
                        {parseUserAgent(log.user_agent)}
                      </div>
                    )}
                  </div>

                  {(() => {
                    const details = getDetailsObject(log.details);
                    return Object.keys(details).length > 0 ? (
                      <div className="mt-2 pt-2 border-t border-border/30">
                        <div className="text-xs text-muted-foreground">
                          {Object.entries(details).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              <span className="opacity-70">{key}:</span>{' '}
                              <span>{String(value)}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditLogViewer;