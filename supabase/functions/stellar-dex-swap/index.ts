import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// USDC issuers per network
const USDC_CONFIG = {
  testnet: {
    code: "USDC",
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    horizonUrl: "https://horizon-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
  },
  mainnet: {
    code: "USDC",
    issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    horizonUrl: "https://horizon.stellar.org",
    networkPassphrase: "Public Global Stellar Network ; September 2015",
  },
};

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

async function decryptSecret(encryptedData: string): Promise<string> {
  const encryptionKey = Deno.env.get("STELLAR_ENCRYPTION_KEY");
  if (encryptedData.startsWith("base64:")) {
    throw new Error("Insecure legacy key format detected. Please regenerate your wallet.");
  }
  if (encryptedData.startsWith("aes256gcm:") && encryptionKey) {
    const combined = Uint8Array.from(atob(encryptedData.slice(10)), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    let keyBytes: Uint8Array;
    const cleanKey = encryptionKey.trim();
    if (/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
      keyBytes = hexToBytes(cleanKey);
    } else {
      try {
        keyBytes = Uint8Array.from(atob(cleanKey), (c) => c.charCodeAt(0));
        if (keyBytes.length !== 32) throw new Error("bad length");
      } catch {
        const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(cleanKey));
        keyBytes = new Uint8Array(hashBuffer);
      }
    }
    const cryptoKey = await crypto.subtle.importKey("raw", keyBytes.buffer as ArrayBuffer, { name: "AES-GCM" }, false, ["decrypt"]);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, encrypted);
    return new TextDecoder().decode(decrypted);
  }
  throw new Error("Failed to decrypt wallet key. Please regenerate your wallet.");
}

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function resolveWallet(supabaseClient: any, token: string, bodyOmsUserId?: string) {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    if (user) {
      const { data: wallet, error } = await supabaseClient
        .from("wallet_balances")
        .select("stellar_public_key, stellar_secret_key_encrypted, user_id, oms_user_id")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return { wallet, userId: user.id };
    }
  } catch { /* not supabase */ }

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

  const { data: w1 } = await supabaseClient
    .from("wallet_balances")
    .select("stellar_public_key, stellar_secret_key_encrypted, user_id, oms_user_id")
    .eq("oms_user_id", omsUserId)
    .maybeSingle();
  if (w1) return { wallet: w1, userId: w1.user_id };

  if (isUUID(omsUserId)) {
    const { data: w2 } = await supabaseClient
      .from("wallet_balances")
      .select("stellar_public_key, stellar_secret_key_encrypted, user_id, oms_user_id")
      .eq("user_id", omsUserId)
      .maybeSingle();
    if (w2) return { wallet: w2, userId: w2.user_id };
  }

  throw new Error("Wallet not found. Please create a wallet first.");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const token = authHeader.replace("Bearer ", "");
    const body = await req.json();
    const { action, network = "testnet", amount, omsUserId } = body;

    const config = USDC_CONFIG[network as keyof typeof USDC_CONFIG];
    if (!config) throw new Error("Invalid network. Use 'testnet' or 'mainnet'.");

    console.log(`[stellar-dex-swap] action=${action}, network=${network}`);

    // For quote action, no wallet needed
    if (action === "quote") {
      const { sourceAsset, destAsset } = body;
      const StellarSdk = await import("https://esm.sh/@stellar/stellar-sdk@12.3.0");
      const server = new StellarSdk.default.Horizon.Server(config.horizonUrl);

      const usdcAsset = new StellarSdk.default.Asset(config.code, config.issuer);
      const nativeAsset = StellarSdk.default.Asset.native();

      const source = sourceAsset === "XLM" ? nativeAsset : usdcAsset;
      const dest = destAsset === "XLM" ? nativeAsset : usdcAsset;

      try {
        // User enters source amount → use strict send to find how much they'll receive
        const sendPaths = await server.strictSendPaths(
          source,
          amount.toString(),
          [dest]
        ).call();

        if (sendPaths.records.length > 0) {
          const bestPath = sendPaths.records[0];
          return new Response(
            JSON.stringify({
              hasPath: true,
              sourceAmount: amount.toString(),
              destAmount: bestPath.destination_amount,
              path: bestPath.path.map((p: any) => p.asset_code || "XLM"),
              type: "strict_send",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
        }

        return new Response(
          JSON.stringify({ 
            hasPath: false, 
            message: "No liquidity available for this swap on the DEX." 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      } catch (err) {
        console.error("Path finding error:", err);
        return new Response(
          JSON.stringify({ hasPath: false, message: "Failed to find swap path" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // For swap action, wallet is needed
    if (action === "swap") {
      const { sourceAsset, destAsset, slippage = 1 } = body;
      const { wallet } = await resolveWallet(supabaseClient, token, omsUserId);

      if (!wallet?.stellar_public_key || !wallet?.stellar_secret_key_encrypted) {
        throw new Error("Wallet not found or missing keys. Please create/regenerate your wallet.");
      }

      const secretKey = await decryptSecret(wallet.stellar_secret_key_encrypted);
      const StellarSdk = await import("https://esm.sh/@stellar/stellar-sdk@12.3.0");
      const server = new StellarSdk.default.Horizon.Server(config.horizonUrl);
      const keypair = StellarSdk.default.Keypair.fromSecret(secretKey);

      if (keypair.publicKey() !== wallet.stellar_public_key) {
        throw new Error("Wallet keys are out of sync. Please regenerate your wallet.");
      }

      const usdcAsset = new StellarSdk.default.Asset(config.code, config.issuer);
      const nativeAsset = StellarSdk.default.Asset.native();

      const source = sourceAsset === "XLM" ? nativeAsset : usdcAsset;
      const dest = destAsset === "XLM" ? nativeAsset : usdcAsset;

      const account = await server.loadAccount(wallet.stellar_public_key);

      // Check source balance
      if (sourceAsset === "XLM") {
        const xlmBal = account.balances.find((b: any) => b.asset_type === "native");
        // Keep 2 XLM as reserve
        const available = parseFloat(xlmBal?.balance || "0") - 2;
        if (available < parseFloat(amount)) {
          throw new Error(`Insufficient XLM balance. Available: ${available.toFixed(7)} XLM (2 XLM reserved)`);
        }
      } else {
        const usdcBal = account.balances.find(
          (b: any) => b.asset_code === config.code && b.asset_issuer === config.issuer
        );
        if (!usdcBal || parseFloat(usdcBal.balance) < parseFloat(amount)) {
          throw new Error(`Insufficient USDC balance.`);
        }
      }

      // Ensure USDC trustline exists if swapping to USDC
      if (destAsset === "USDC") {
        const hasTrustline = account.balances.some(
          (b: any) => b.asset_code === config.code && b.asset_issuer === config.issuer
        );
        if (!hasTrustline) {
          throw new Error("USDC trustline not found. Please create a trustline first.");
        }
      }

      // Use path payment strict send for XLM→USDC, strict receive for USDC→XLM
      const slippageMultiplier = 1 + slippage / 100;
      const slippageDivisor = 1 - slippage / 100;

      let operation;
      if (sourceAsset === "XLM") {
        // Strict send: send exact XLM, receive at least (estimated - slippage) USDC
        // First get a quote
        const sendPaths = await server.strictSendPaths(source, amount.toString(), [dest]).call();
        if (sendPaths.records.length === 0) throw new Error("No DEX liquidity for this swap.");
        const expectedDest = parseFloat(sendPaths.records[0].destination_amount);
        const minDest = (expectedDest * slippageDivisor).toFixed(7);

        operation = StellarSdk.default.Operation.pathPaymentStrictSend({
          sendAsset: source,
          sendAmount: amount.toString(),
          destination: wallet.stellar_public_key,
          destAsset: dest,
          destMin: minDest,
          path: sendPaths.records[0].path.map((p: any) => 
            p.asset_type === "native" ? StellarSdk.default.Asset.native() : new StellarSdk.default.Asset(p.asset_code, p.asset_issuer)
          ),
        });
      } else {
        // Strict send: send exact USDC, receive at least (estimated - slippage) XLM
        const sendPaths = await server.strictSendPaths(source, amount.toString(), [dest]).call();
        if (sendPaths.records.length === 0) throw new Error("No DEX liquidity for this swap.");
        const expectedDest = parseFloat(sendPaths.records[0].destination_amount);
        const minDest = (expectedDest * slippageDivisor).toFixed(7);

        operation = StellarSdk.default.Operation.pathPaymentStrictSend({
          sendAsset: source,
          sendAmount: amount.toString(),
          destination: wallet.stellar_public_key,
          destAsset: dest,
          destMin: minDest,
          path: sendPaths.records[0].path.map((p: any) => 
            p.asset_type === "native" ? StellarSdk.default.Asset.native() : new StellarSdk.default.Asset(p.asset_code, p.asset_issuer)
          ),
        });
      }

      const transaction = new StellarSdk.default.TransactionBuilder(account, {
        fee: StellarSdk.default.BASE_FEE,
        networkPassphrase: config.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      transaction.sign(keypair);
      const result = await server.submitTransaction(transaction);
      console.log(`[stellar-dex-swap] Swap successful: ${result.hash}`);

      // Log the transaction
      await supabaseClient.from("transactions").insert({
        user_id: wallet.user_id,
        type: "dex_swap",
        amount: parseFloat(amount),
        currency: sourceAsset,
        status: "completed",
        payment_method: "stellar_dex",
        notes: `Swapped ${amount} ${sourceAsset} → ${destAsset} on ${network}`,
      });

      const explorerBase = network === "mainnet" 
        ? "https://stellar.expert/explorer/public" 
        : "https://stellar.expert/explorer/testnet";

      return new Response(
        JSON.stringify({
          success: true,
          transactionHash: result.hash,
          explorerUrl: `${explorerBase}/tx/${result.hash}`,
          message: `Successfully swapped ${amount} ${sourceAsset} → ${destAsset}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get current balances
    if (action === "balances") {
      const { wallet } = await resolveWallet(supabaseClient, token, omsUserId);
      if (!wallet?.stellar_public_key) throw new Error("Wallet not found.");

      const StellarSdk = await import("https://esm.sh/@stellar/stellar-sdk@12.3.0");
      const server = new StellarSdk.default.Horizon.Server(config.horizonUrl);

      try {
        const account = await server.loadAccount(wallet.stellar_public_key);
        const xlmBal = account.balances.find((b: any) => b.asset_type === "native");
        const usdcBal = account.balances.find(
          (b: any) => b.asset_code === config.code && b.asset_issuer === config.issuer
        );

        return new Response(
          JSON.stringify({
            xlm: xlmBal?.balance || "0",
            usdc: usdcBal?.balance || "0",
            hasTrustline: !!usdcBal,
            publicKey: wallet.stellar_public_key,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      } catch {
        return new Response(
          JSON.stringify({ xlm: "0", usdc: "0", hasTrustline: false, publicKey: wallet.stellar_public_key }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    throw new Error(`Invalid action: ${action}`);
  } catch (error) {
    console.error("[stellar-dex-swap] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
