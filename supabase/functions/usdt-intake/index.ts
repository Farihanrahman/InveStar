import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supported USDT chains
const USDT_CHAINS = {
  trc20: {
    name: 'USDT (TRC-20)',
    network: 'Tron',
    confirmations: 19,
    estimatedTime: '~2 min',
    fee: 0.5, // 0.5% conversion fee
    minDeposit: 10,
    maxDeposit: 50000,
    // Simulated intake address (in production, generated per-user)
    depositAddress: 'TSimulated1nVeStArUSDTIntake2026Addr',
  },
  solana: {
    name: 'USDT (Solana)',
    network: 'Solana',
    confirmations: 32,
    estimatedTime: '~30 sec',
    fee: 0.3,
    minDeposit: 5,
    maxDeposit: 50000,
    depositAddress: '7SimUSDTSolanaIntakeAddress2026InveStar',
  },
  ethereum: {
    name: 'USDT (ERC-20)',
    network: 'Ethereum',
    confirmations: 12,
    estimatedTime: '~5 min',
    fee: 1.0, // Higher due to gas
    minDeposit: 50,
    maxDeposit: 100000,
    depositAddress: '0xSimulatedUSDTERC20IntakeAddr2026',
  },
};

// Simulated conversion rate (USDT → USDC is ~1:1 with small spread)
const USDT_TO_USDC_RATE = 0.9995; // 1 USDT = 0.9995 USDC

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, chain, amount, omsUserId, transactionId } = await req.json();
    console.log(`USDT intake action: ${action}, chain: ${chain}, amount: ${amount}`);

    // Get supported chains
    if (action === 'get_chains') {
      return new Response(
        JSON.stringify({
          chains: Object.entries(USDT_CHAINS).map(([key, value]) => ({
            id: key,
            ...value,
          })),
          conversionRate: USDT_TO_USDC_RATE,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get conversion quote
    if (action === 'quote') {
      const chainData = USDT_CHAINS[chain as keyof typeof USDT_CHAINS];
      if (!chainData) throw new Error('Invalid chain selected');
      if (!amount || amount <= 0) throw new Error('Invalid amount');
      if (amount < chainData.minDeposit) throw new Error(`Minimum is ${chainData.minDeposit} USDT`);
      if (amount > chainData.maxDeposit) throw new Error(`Maximum is ${chainData.maxDeposit} USDT`);

      const conversionFee = (amount * chainData.fee) / 100;
      const netUsdt = amount - conversionFee;
      const usdcAmount = netUsdt * USDT_TO_USDC_RATE;

      return new Response(
        JSON.stringify({
          success: true,
          quote: {
            usdtAmount: amount,
            chain: chainData.name,
            network: chainData.network,
            conversionFee,
            feePercent: chainData.fee,
            netUsdt,
            usdcAmount: parseFloat(usdcAmount.toFixed(4)),
            rate: USDT_TO_USDC_RATE,
            estimatedTime: chainData.estimatedTime,
            depositAddress: chainData.depositAddress,
            expiresIn: 900, // 15 min quote validity
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Resolve wallet for authenticated actions
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

    // Initiate USDT deposit (creates pending transaction)
    if (action === 'initiate_deposit') {
      const chainData = USDT_CHAINS[chain as keyof typeof USDT_CHAINS];
      if (!chainData) throw new Error('Invalid chain selected');
      if (amount < chainData.minDeposit) throw new Error(`Minimum deposit is ${chainData.minDeposit} USDT`);
      if (amount > chainData.maxDeposit) throw new Error(`Maximum deposit is ${chainData.maxDeposit} USDT`);

      const conversionFee = (amount * chainData.fee) / 100;
      const netUsdt = amount - conversionFee;
      const usdcAmount = parseFloat((netUsdt * USDT_TO_USDC_RATE).toFixed(4));

      const { data: transaction, error: txError } = await supabaseClient
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'usdt_deposit',
          amount: usdcAmount,
          currency: 'USDC',
          status: 'pending',
          payment_method: `usdt_${chain}`,
          notes: JSON.stringify({
            sourceAsset: 'USDT',
            sourceChain: chainData.name,
            sourceNetwork: chainData.network,
            usdtAmount: amount,
            conversionFee,
            feePercent: chainData.fee,
            usdcAmount,
            rate: USDT_TO_USDC_RATE,
            depositAddress: chainData.depositAddress,
            stellarAddress: wallet.stellar_public_key,
          }),
        })
        .select()
        .single();

      if (txError) throw txError;

      return new Response(
        JSON.stringify({
          success: true,
          transactionId: transaction.id,
          depositAddress: chainData.depositAddress,
          message: `Send ${amount} USDT to the deposit address on ${chainData.network}. Your wallet will be credited with ${usdcAmount} USDC after conversion.`,
          details: {
            usdtAmount: amount,
            chain: chainData.name,
            network: chainData.network,
            conversionFee,
            usdcAmount,
            estimatedTime: chainData.estimatedTime,
            depositAddress: chainData.depositAddress,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Complete deposit (testnet simulation)
    if (action === 'complete_deposit') {
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

      // Credit USDC to wallet
      const newUsdcBalance = parseFloat(wallet.balance_usdc?.toString() || '0') + usdcAmount;

      await supabaseClient
        .from('wallet_balances')
        .update({ balance_usdc: newUsdcBalance })
        .eq('user_id', userId);

      await supabaseClient
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transactionId);

      console.log(`USDT deposit completed: ${notes.usdtAmount} USDT → ${usdcAmount} USDC via ${notes.sourceChain}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Successfully converted ${notes.usdtAmount} USDT to ${usdcAmount.toFixed(2)} USDC and credited to your wallet`,
          newBalance: newUsdcBalance,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('Error in usdt-intake:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
