import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Testnet USDC asset details
const USDC_ASSET_CODE = 'USDC';
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

// Simulated anchor info (in production, these would be real anchor endpoints)
const ANCHORS = {
  circle: {
    name: 'Circle (Simulated)',
    domain: 'circle.com',
    sep24Url: 'https://anchor.circle.com/sep24',
    fee: 0.1, // 0.1% fee
    minDeposit: 10,
    maxDeposit: 10000,
  },
  moneygram: {
    name: 'MoneyGram Access (Simulated)',
    domain: 'moneygram.com', 
    sep24Url: 'https://extstellar.moneygram.com/sep24',
    fee: 1.0, // 1% fee
    minDeposit: 20,
    maxDeposit: 500,
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, anchor, amount, rampType, omsUserId, transactionId } = await req.json();
    console.log(`Anchor ramp action: ${action}, anchor: ${anchor}, amount: ${amount}, type: ${rampType}`);

    // get_anchors doesn't require auth
    if (action === 'get_anchors') {
      return new Response(
        JSON.stringify({ 
          anchors: Object.entries(ANCHORS).map(([key, value]) => ({
            id: key,
            ...value
          }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // For all other actions, resolve the user's wallet via OMS user ID or Supabase auth
    let wallet: any = null;
    let userId: string | null = null;

    if (omsUserId) {
      const { data, error } = await supabaseClient
        .from('wallet_balances')
        .select('stellar_public_key, stellar_secret_key_encrypted, balance_usd, balance_usdc, user_id')
        .eq('oms_user_id', String(omsUserId))
        .single();
      if (error || !data) throw new Error('Wallet not found for this user');
      wallet = data;
      userId = data.user_id;
    } else {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('Not authenticated');
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
      
      const { data, error } = await supabaseClient
        .from('wallet_balances')
        .select('stellar_public_key, stellar_secret_key_encrypted, balance_usd, balance_usdc, user_id')
        .eq('user_id', user.id)
        .single();
      if (error || !data) throw new Error('Wallet not found');
      wallet = data;
    }

    if (!wallet?.stellar_public_key) {
      throw new Error('Stellar wallet not found. Please create a wallet first.');
    }


    if (action === 'initiate_deposit') {
      // USD -> USDC (On-ramp)
      const selectedAnchor = ANCHORS[anchor as keyof typeof ANCHORS];
      if (!selectedAnchor) throw new Error('Invalid anchor selected');

      if (amount < selectedAnchor.minDeposit) {
        throw new Error(`Minimum deposit is $${selectedAnchor.minDeposit}`);
      }
      if (amount > selectedAnchor.maxDeposit) {
        throw new Error(`Maximum deposit is $${selectedAnchor.maxDeposit}`);
      }

      // Calculate fee and USDC amount
      const fee = (amount * selectedAnchor.fee) / 100;
      const usdcAmount = amount - fee;

      console.log(`Initiating deposit: $${amount} USD -> ${usdcAmount} USDC via ${selectedAnchor.name}`);

      // For testnet simulation, we'll "mint" USDC by recording the transaction
      // In production, this would redirect to the anchor's SEP-24 interactive flow

      // Create a pending transaction record
      const { data: transaction, error: txError } = await supabaseClient
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'usdc_deposit',
          amount: usdcAmount,
          currency: 'USDC',
          status: 'pending',
          payment_method: `anchor_${anchor}`,
          notes: JSON.stringify({
            anchor: selectedAnchor.name,
            usdAmount: amount,
            fee: fee,
            usdcAmount: usdcAmount,
            stellarAddress: wallet.stellar_public_key,
          })
        })
        .select()
        .single();

      if (txError) throw txError;

      // Generate a simulated SEP-24 interactive URL
      // In production, this would be a real anchor URL
      const interactiveUrl = `https://stellar-testnet-anchor-sim.lovable.app/deposit?` + 
        `transaction_id=${transaction.id}&` +
        `amount=${amount}&` +
        `asset=USDC&` +
        `anchor=${anchor}`;

      return new Response(
        JSON.stringify({ 
          success: true,
          transactionId: transaction.id,
          interactiveUrl: interactiveUrl,
          message: `Deposit initiated. In production, you would be redirected to ${selectedAnchor.name} to complete payment.`,
          details: {
            usdAmount: amount,
            fee: fee,
            usdcAmount: usdcAmount,
            anchor: selectedAnchor.name,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (action === 'initiate_withdrawal') {
      // USDC -> USD (Off-ramp)
      const selectedAnchor = ANCHORS[anchor as keyof typeof ANCHORS];
      if (!selectedAnchor) throw new Error('Invalid anchor selected');

      // Check USDC balance (prefer live on-chain balance, fallback to stored wallet balance)
      let currentUsdc = parseFloat(wallet.balance_usdc?.toString() || '0');
      if (wallet.stellar_public_key) {
        try {
          const accountRes = await fetch(`https://horizon-testnet.stellar.org/accounts/${wallet.stellar_public_key}`);
          if (accountRes.ok) {
            const accountData = await accountRes.json();
            const usdcBalance = accountData?.balances?.find((b: any) =>
              b.asset_type !== 'native' &&
              b.asset_code === USDC_ASSET_CODE &&
              b.asset_issuer === USDC_ISSUER
            );
            if (usdcBalance?.balance) {
              currentUsdc = parseFloat(usdcBalance.balance);
            }
          }
        } catch (balanceError) {
          console.warn('Failed to fetch live USDC balance, using stored balance:', balanceError);
        }
      }

      if (amount > currentUsdc) {
        throw new Error(`Insufficient USDC balance. You have ${currentUsdc.toFixed(2)} USDC`);
      }

      // Calculate fee and USD amount
      const fee = (amount * selectedAnchor.fee) / 100;
      const usdAmount = amount - fee;

      console.log(`Initiating withdrawal: ${amount} USDC -> $${usdAmount} USD via ${selectedAnchor.name}`);

      // Create a pending transaction record
      const { data: transaction, error: txError } = await supabaseClient
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'usdc_withdrawal',
          amount: amount,
          currency: 'USDC',
          status: 'pending',
          payment_method: `anchor_${anchor}`,
          notes: JSON.stringify({
            anchor: selectedAnchor.name,
            usdcAmount: amount,
            fee: fee,
            usdAmount: usdAmount,
            stellarAddress: wallet.stellar_public_key,
          })
        })
        .select()
        .single();

      if (txError) throw txError;

      // Generate a simulated SEP-24 interactive URL
      const interactiveUrl = `https://stellar-testnet-anchor-sim.lovable.app/withdraw?` + 
        `transaction_id=${transaction.id}&` +
        `amount=${amount}&` +
        `asset=USDC&` +
        `anchor=${anchor}`;

      return new Response(
        JSON.stringify({ 
          success: true,
          transactionId: transaction.id,
          interactiveUrl: interactiveUrl,
          message: `Withdrawal initiated. In production, you would provide bank details to ${selectedAnchor.name}.`,
          details: {
            usdcAmount: amount,
            fee: fee,
            usdAmount: usdAmount,
            anchor: selectedAnchor.name,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (action === 'complete_testnet_deposit') {
      // Get the transaction
      const { data: tx } = await supabaseClient
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', userId)
        .single();

      if (!tx || tx.status !== 'pending') {
        throw new Error('Transaction not found or already processed');
      }

      const notes = JSON.parse(tx.notes || '{}');
      const usdcAmount = notes.usdcAmount || tx.amount;

      // Update wallet USDC balance (simulated mint)
      const newUsdcBalance = parseFloat(wallet.balance_usdc?.toString() || '0') + usdcAmount;
      
      await supabaseClient
        .from('wallet_balances')
        .update({ balance_usdc: newUsdcBalance })
        .eq('user_id', userId);

      // Mark transaction as completed
      await supabaseClient
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transactionId);

      console.log(`Testnet deposit completed: ${usdcAmount} USDC added to wallet`);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: `Successfully added ${usdcAmount.toFixed(2)} USDC to your wallet`,
          newBalance: newUsdcBalance
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('Error in stellar-anchor-ramp:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
