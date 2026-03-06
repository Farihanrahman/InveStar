import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

async function encryptSecret(secretKey: string): Promise<string> {
  const encryptionKey = Deno.env.get('STELLAR_ENCRYPTION_KEY');
  if (!encryptionKey) {
    throw new Error('STELLAR_ENCRYPTION_KEY not configured. Wallet operations are disabled for security.');
  }
  
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    let keyBytes: Uint8Array;
    const cleanKey = encryptionKey.trim();
    
    if (/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
      keyBytes = hexToBytes(cleanKey);
    } else {
      try {
        keyBytes = Uint8Array.from(atob(cleanKey), c => c.charCodeAt(0));
        if (keyBytes.length !== 32) throw new Error('bad length');
      } catch {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(cleanKey);
        const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
        keyBytes = new Uint8Array(hashBuffer);
      }
    }
    
    const cryptoKey = await crypto.subtle.importKey('raw', keyBytes.buffer as ArrayBuffer, { name: 'AES-GCM' }, false, ['encrypt']);
    const encoder = new TextEncoder();
    const secretData = encoder.encode(secretKey);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, secretData);
    
    const encryptedArray = new Uint8Array(encrypted);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);
    
    return 'aes256gcm:' + btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt wallet key.');
  }
}

/**
 * Dual auth: try Supabase JWT first, then OMS token.
 */
async function resolveUser(supabaseClient: any, token: string, bodyOmsUserId?: string) {
  // Try Supabase auth
  try {
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    if (user) return { userId: user.id, omsUserId: null, authProvider: "supabase" as const };
  } catch { /* not a Supabase JWT */ }

  // OMS auth
  let omsUserId = bodyOmsUserId;
  if (!omsUserId) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        omsUserId = String(payload.sub || payload.id || payload.user_id || payload.userId || "");
      }
    } catch { /* ignore */ }
  }

  if (!omsUserId) throw new Error("User not authenticated");
  return { userId: null, omsUserId, authProvider: "oms" as const };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const token = authHeader.replace('Bearer ', '');

    let action = 'create';
    let bodyOmsUserId: string | undefined;
    try {
      const body = await req.json();
      action = body.action || 'create';
      bodyOmsUserId = body.omsUserId;
    } catch { /* no body */ }

    const { userId, omsUserId, authProvider } = await resolveUser(supabaseClient, token, bodyOmsUserId);
    console.log(`Stellar wallet action: ${action}, authProvider: ${authProvider}, userId: ${userId}, omsUserId: ${omsUserId}`);

    // Find existing wallet
    let existingWallet;
    if (userId) {
      const { data } = await supabaseClient
        .from('wallet_balances')
        .select('stellar_public_key, stellar_secret_key_encrypted, user_id')
        .eq('user_id', userId)
        .single();
      existingWallet = data;
    } else if (omsUserId) {
      // Try oms_user_id first
      const { data: w1 } = await supabaseClient
        .from('wallet_balances')
        .select('stellar_public_key, stellar_secret_key_encrypted, user_id')
        .eq('oms_user_id', omsUserId)
        .maybeSingle();
      existingWallet = w1;

      // Fallback only if omsUserId is a valid UUID
      if (!existingWallet && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(omsUserId)) {
        const { data: w2 } = await supabaseClient
          .from('wallet_balances')
          .select('stellar_public_key, stellar_secret_key_encrypted, user_id')
          .eq('user_id', omsUserId)
          .maybeSingle();
        existingWallet = w2;

        if (existingWallet) {
          await supabaseClient
            .from('wallet_balances')
            .update({ oms_user_id: omsUserId })
            .eq('user_id', omsUserId);
        }
      }
    }

    // If action is 'create' and wallet exists, return existing wallet
    if (action === 'create' && existingWallet?.stellar_public_key) {
      return new Response(
        JSON.stringify({ publicKey: existingWallet.stellar_public_key, message: 'Wallet already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Generate new Stellar keypair
    console.log(action === 'regenerate' ? 'Regenerating Stellar wallet...' : 'Creating new Stellar wallet...');
    const StellarSdk = await import('https://esm.sh/@stellar/stellar-sdk@12.3.0');
    const keypair = StellarSdk.default.Keypair.random();
    const publicKey = keypair.publicKey();
    const secretKey = keypair.secret();
    console.log('Generated Stellar public key:', publicKey);

    // Fund on testnet
    let testnetFunded = false;
    try {
      const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
      if (response.ok) {
        await response.json();
        testnetFunded = true;
      } else {
        await response.text();
      }
    } catch (error) {
      console.error('Error funding via Friendbot:', error);
    }

    const encryptedSecret = await encryptSecret(secretKey);

    if (existingWallet) {
      // Update existing wallet row
      const updateFilter = userId 
        ? { user_id: userId }
        : { oms_user_id: omsUserId };
      
      const { error: updateError } = await supabaseClient
        .from('wallet_balances')
        .update({
          stellar_public_key: publicKey,
          stellar_secret_key_encrypted: encryptedSecret,
        })
        .match(updateFilter);

      if (updateError) throw updateError;
    } else {
      // Create new wallet row for OMS user
      const newUserId = crypto.randomUUID();
      const { error: insertError } = await supabaseClient
        .from('wallet_balances')
        .insert({
          user_id: newUserId,
          oms_user_id: omsUserId,
          stellar_public_key: publicKey,
          stellar_secret_key_encrypted: encryptedSecret,
          balance_usd: 0,
          balance_usdc: 0,
        });

      if (insertError) throw insertError;
    }

    console.log(`Stellar wallet ${action === 'regenerate' ? 'regenerated' : 'created'} successfully. Funded: ${testnetFunded}`);

    return new Response(
      JSON.stringify({
        publicKey,
        message: `Stellar wallet ${action === 'regenerate' ? 'regenerated' : 'created'} successfully on testnet`,
        testnetFunded,
        encrypted: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
