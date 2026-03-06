import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Navigation from "@/components/Navigation";

export default function TestStellar() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('test-stellar');

      if (error) throw error;

      setResult(data);
      
      if (data.success) {
        toast({
          title: "Test Successful!",
          description: "Stellar testnet is working correctly.",
        });
      } else {
        toast({
          title: "Test Failed",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: "Test Error",
        description: error.message || "Failed to run test",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Stellar Testnet Test
          </h1>
          <p className="text-muted-foreground mt-2">
            Test the Stellar testnet integration
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connection Test</CardTitle>
            <CardDescription>
              This will test keypair generation, Friendbot funding, and Horizon API queries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runTest} 
              disabled={testing}
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Run Stellar Testnet Test'
              )}
            </Button>

            {result && (
              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-semibold">
                    {result.success ? 'All Tests Passed' : 'Tests Failed'}
                  </span>
                </div>

                {result.tests && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <h3 className="font-semibold mb-2">Test Results:</h3>
                    <div className="space-y-1 text-sm">
                      <div>Keypair Generation: {result.tests.keypairGeneration}</div>
                      <div>Friendbot Funding: {result.tests.friendbotFunding}</div>
                      <div>Account Query: {result.tests.accountQuery}</div>
                    </div>
                  </div>
                )}

                {result.testAccount && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <h3 className="font-semibold mb-2">Test Account:</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Public Key:</span>
                        <code className="block mt-1 p-2 bg-muted rounded text-xs break-all">
                          {result.testAccount.publicKey}
                        </code>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Balances:</span>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(result.testAccount.balances, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {result.error && (
                  <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                    <p className="text-sm text-destructive">{result.error}</p>
                    {result.details && (
                      <p className="text-sm text-muted-foreground mt-2">{result.details}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
