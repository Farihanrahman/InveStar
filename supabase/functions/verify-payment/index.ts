import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Stripe key not configured');
    }

    const stripe = new Stripe(stripeKey.trim(), {
      apiVersion: '2025-08-27.basil',
    });

    console.log('Verifying payment session:', sessionId);

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    console.log('Session status:', session.payment_status);

    // Get authenticated user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if payment was successful
    if (session.payment_status === 'paid') {
      // Check if transaction already exists
      const { data: existingTransaction } = await supabaseClient
        .from('transactions')
        .select('id')
        .eq('stripe_session_id', sessionId)
        .single();

      if (existingTransaction) {
        console.log('Transaction already processed');
        return new Response(
          JSON.stringify({ success: true, message: 'Transaction already processed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const amount = session.amount_total! / 100; // Convert from cents to dollars

      // Create transaction record
      const { error: transactionError } = await supabaseClient
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'deposit',
          amount: amount,
          currency: 'USD',
          status: 'completed',
          payment_method: 'stripe',
          stripe_session_id: sessionId,
          notes: 'Stripe checkout payment',
        });

      if (transactionError) {
        console.error('Transaction creation error:', transactionError);
        throw transactionError;
      }

      // Update wallet balance
      const { data: wallet, error: walletFetchError } = await supabaseClient
        .from('wallet_balances')
        .select('balance_usd')
        .eq('user_id', user.id)
        .single();

      if (walletFetchError) {
        console.error('Wallet fetch error:', walletFetchError);
        throw walletFetchError;
      }

      const newBalance = parseFloat(wallet.balance_usd) + amount;

      const { error: walletUpdateError } = await supabaseClient
        .from('wallet_balances')
        .update({ balance_usd: newBalance })
        .eq('user_id', user.id);

      if (walletUpdateError) {
        console.error('Wallet update error:', walletUpdateError);
        throw walletUpdateError;
      }

      console.log('Payment verified and wallet updated successfully');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Payment verified and wallet updated',
          amount: amount,
          newBalance: newBalance
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Payment not completed',
          status: session.payment_status
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
