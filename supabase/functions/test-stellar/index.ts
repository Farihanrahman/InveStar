import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    // Authenticate user - only authenticated users can run tests
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Testing Stellar testnet connection for user:', user.id);

    // Dynamically import Stellar SDK
    const StellarSdk = await import('https://esm.sh/@stellar/stellar-sdk@12.3.0?bundle');
    
    // Test 1: Generate a keypair (only log public key, never log secret)
    const keypair = StellarSdk.Keypair.random();
    const publicKey = keypair.publicKey();

    console.log('✓ Keypair generated:', publicKey);

    // Test 2: Fund account using Friendbot
    try {
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
      );
      const responseJSON = await response.json();
      console.log('✓ Friendbot funding completed');
    } catch (error) {
      console.error('✗ Friendbot error');
      throw new Error('Failed to fund account with Friendbot');
    }

    // Test 3: Check account balance on testnet
    const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
    
    // Wait a bit for friendbot to process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      const account = await server.loadAccount(publicKey);
      console.log('✓ Account loaded from testnet');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Stellar testnet connection successful!',
          tests: {
            keypairGeneration: '✓ Success',
            friendbotFunding: '✓ Success',
            accountQuery: '✓ Success',
          },
          testAccount: {
            publicKey: publicKey,
            balances: account.balances,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (error) {
      console.error('✗ Account query error');
      throw new Error('Failed to query account from Horizon');
    }
  } catch (error) {
    console.error('Test failed');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        details: 'One or more Stellar testnet tests failed. Check logs for details.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
