import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Stellar testnet USDC asset (Circle's testnet USDC)
const USDC_ASSET_CODE = "USDC";
const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

const isValidStellarAddress = (address: string): boolean => {
  return /^G[A-Z2-7]{55}$/.test(address);
};

const isValidAmount = (amount: number): { valid: boolean; error?: string } => {
  if (typeof amount !== "number" || isNaN(amount)) return { valid: false, error: "Amount must be a valid number" };
  if (!isFinite(amount)) return { valid: false, error: "Amount must be finite" };
  if (amount <= 0) return { valid: false, error: "Amount must be greater than 0" };
  if (amount > 1000000) return { valid: false, error: "Amount exceeds maximum limit of 1,000,000" };
  return { valid: true };
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
    throw new Error("Insecure legacy key format detected. Please regenerate your wallet with proper AES-256-GCM encryption.");
  }

  if (encryptedData.startsWith("aes256gcm:") && encryptionKey) {
    console.log("Using AES-256-GCM decryption");
    try {
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
        } catch {
          const encoder = new TextEncoder();
          const keyData = encoder.encode(cleanKey);
          const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
          keyBytes = new Uint8Array(hashBuffer);
        }
      }

      const cryptoKey = await crypto.subtle.importKey("raw", keyBytes.buffer as ArrayBuffer, { name: "AES-GCM" }, false, ["decrypt"]);
      const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, encrypted);
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error("AES decryption failed:", error);
      throw new Error("Failed to decrypt wallet key. Please regenerate your wallet.");
    }
  }

  // Legacy format: iv:ciphertext:authTag
  if (encryptionKey) {
    const parts = encryptedData.split(":");
    if (parts.length === 3) {
      try {
        const iv = Uint8Array.from(atob(parts[0]), (c) => c.charCodeAt(0));
        const ciphertext = Uint8Array.from(atob(parts[1]), (c) => c.charCodeAt(0));
        const authTag = Uint8Array.from(atob(parts[2]), (c) => c.charCodeAt(0));
        const combined = new Uint8Array(ciphertext.length + authTag.length);
        combined.set(ciphertext);
        combined.set(authTag, ciphertext.length);

        let keyBytes: Uint8Array;
        const cleanKey = encryptionKey.trim();
        if (/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
          keyBytes = hexToBytes(cleanKey);
        } else {
          try {
            keyBytes = Uint8Array.from(atob(cleanKey), (c) => c.charCodeAt(0));
          } catch {
            const encoder = new TextEncoder();
            const keyData = encoder.encode(cleanKey);
            const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
            keyBytes = new Uint8Array(hashBuffer);
          }
        }

        const cryptoKey = await crypto.subtle.importKey("raw", keyBytes.buffer as ArrayBuffer, { name: "AES-GCM" }, false, ["decrypt"]);
        const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, combined);
        return new TextDecoder().decode(decrypted);
      } catch (error) {
        console.error("Legacy decryption failed:", error);
      }
    }
  }

  console.warn("Using raw base64 decoding (oldest legacy format)");
  const decodedBytes = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(decodedBytes);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isHorizonNotFound = (err: any) => {
  const status = err?.response?.status;
  const title = err?.response?.title;
  return status === 404 || title === "Resource Missing";
};

async function fundWithFriendbot(publicKey: string) {
  console.log("Funding testnet account via Friendbot for:", publicKey);
  const res = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("Friendbot funding failed:", res.status, body);
    throw new Error("Failed to fund testnet account. Please try again in a moment.");
  }
}

async function loadAccountWithAutoFund(server: any, publicKey: string) {
  try {
    return await server.loadAccount(publicKey);
  } catch (err: any) {
    if (!isHorizonNotFound(err)) throw err;
    await fundWithFriendbot(publicKey);
    for (let attempt = 0; attempt < 5; attempt++) {
      await sleep(400 + attempt * 250);
      try {
        return await server.loadAccount(publicKey);
      } catch (err2: any) {
        if (!isHorizonNotFound(err2)) throw err2;
      }
    }
    throw new Error("Stellar testnet account not found. Please regenerate your wallet and try again.");
  }
}

/**
 * Dual auth: try Supabase JWT first, then OMS token (extract user info from JWT payload).
 * Returns the wallet row for the authenticated user.
 */
async function resolveWallet(supabaseClient: any, token: string, bodyOmsUserId?: string) {
  // Try Supabase auth first
  try {
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    if (user) {
      const { data: wallet, error } = await supabaseClient
        .from("wallet_balances")
        .select("stellar_public_key, stellar_secret_key_encrypted, user_id, oms_user_id")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return { wallet, userId: user.id, authProvider: "supabase" as const };
    }
  } catch {
    // Not a Supabase JWT
  }

  // OMS auth: extract user ID from JWT payload or use body param
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

  if (!omsUserId) {
    throw new Error("User not authenticated. Could not resolve identity.");
  }

  console.log(`[stellar-usdc-transfer] OMS user: ${omsUserId}`);

  // Look up wallet by oms_user_id first, then fallback to user_id
  let wallet;
  const { data: w1, error: e1 } = await supabaseClient
    .from("wallet_balances")
    .select("stellar_public_key, stellar_secret_key_encrypted, user_id, oms_user_id")
    .eq("oms_user_id", omsUserId)
    .maybeSingle();
  if (e1) throw e1;
  wallet = w1;

  // Fallback: OMS user ID might be stored as user_id (e.g. from Google OAuth)
  if (!wallet) {
    const { data: w2, error: e2 } = await supabaseClient
      .from("wallet_balances")
      .select("stellar_public_key, stellar_secret_key_encrypted, user_id, oms_user_id")
      .eq("user_id", omsUserId)
      .maybeSingle();
    if (e2) throw e2;
    wallet = w2;

    // Backfill oms_user_id so future lookups work
    if (wallet && !wallet.oms_user_id) {
      await supabaseClient
        .from("wallet_balances")
        .update({ oms_user_id: omsUserId })
        .eq("user_id", omsUserId);
    }
  }

  return { wallet, userId: wallet?.user_id || omsUserId, authProvider: "oms" as const };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const token = authHeader.replace("Bearer ", "");
    const body = await req.json();
    const { action, recipientAddress, amount, omsUserId: bodyOmsUserId, network: networkParam } = body;
    console.log(`USDC Transfer action: ${action}`);

    const { wallet, userId } = await resolveWallet(supabaseClient, token, bodyOmsUserId);

    if (!wallet?.stellar_public_key) {
      throw new Error("Stellar wallet not found. Please create a wallet first.");
    }

    if (!wallet.stellar_secret_key_encrypted) {
      throw new Error("Wallet secret key missing. Please regenerate your wallet.");
    }

    const secretKey = await decryptSecret(wallet.stellar_secret_key_encrypted);

    const StellarSdk = await import("https://esm.sh/@stellar/stellar-sdk@12.3.0?bundle");
    
    const isMainnet = networkParam === "mainnet";
    const horizonUrl = isMainnet ? "https://horizon.stellar.org" : "https://horizon-testnet.stellar.org";
    const networkPassphrase = isMainnet ? StellarSdk.default.Networks.PUBLIC : StellarSdk.default.Networks.TESTNET;
    const usdcIssuer = isMainnet ? "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" : USDC_ISSUER;
    const explorerNetwork = isMainnet ? "public" : "testnet";
    const server = new StellarSdk.default.Horizon.Server(horizonUrl);

    let keypair;
    try {
      keypair = StellarSdk.default.Keypair.fromSecret(secretKey);
    } catch (err) {
      console.error("Invalid Stellar secret key:", err);
      throw new Error("Wallet keys are invalid. Please regenerate your wallet.");
    }

    const derivedPublicKey = keypair.publicKey();
    if (wallet.stellar_public_key !== derivedPublicKey) {
      throw new Error("Wallet keys are out of sync. Please regenerate your wallet.");
    }

    const publicKey = derivedPublicKey;

    if (action === "check_trustline") {
      try {
        const account = await server.loadAccount(publicKey);
        const hasTrustline = account.balances.some(
          (b: any) => b.asset_code === USDC_ASSET_CODE && b.asset_issuer === usdcIssuer,
        );
        const usdcBal = account.balances.find(
          (b: any) => b.asset_code === USDC_ASSET_CODE && b.asset_issuer === usdcIssuer,
        );
        return new Response(
          JSON.stringify({ hasTrustline, usdcBalance: usdcBal?.balance || "0", publicKey }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );
      } catch (error) {
        console.error("Error checking trustline:", error);
        return new Response(
          JSON.stringify({ hasTrustline: false, usdcBalance: "0", publicKey }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );
      }
    }

    if (action === "create_trustline") {
      console.log("Creating USDC trustline for:", publicKey);
      const account = await loadAccountWithAutoFund(server, publicKey);
      const usdcAsset = new StellarSdk.default.Asset(USDC_ASSET_CODE, usdcIssuer);
      const transaction = new StellarSdk.default.TransactionBuilder(account, {
        fee: StellarSdk.default.BASE_FEE,
        networkPassphrase,
      })
        .addOperation(StellarSdk.default.Operation.changeTrust({ asset: usdcAsset, limit: "1000000" }))
        .setTimeout(30)
        .build();

      transaction.sign(keypair);
      const result = await server.submitTransaction(transaction);
      console.log("Trustline created:", result.hash);

      return new Response(
        JSON.stringify({ success: true, message: "USDC trustline created successfully", transactionHash: result.hash }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    if (action === "send_usdc") {
      if (!recipientAddress || typeof recipientAddress !== "string") throw new Error("Recipient address is required");
      const trimmedAddress = recipientAddress.trim();
      if (!isValidStellarAddress(trimmedAddress)) throw new Error("Invalid Stellar address format.");

      const numAmount = typeof amount === "number" ? amount : parseFloat(amount);
      const amountValidation = isValidAmount(numAmount);
      if (!amountValidation.valid) throw new Error(amountValidation.error);

      console.log(`Sending ${numAmount} USDC to ${trimmedAddress.substring(0, 8)}...`);
      const account = await loadAccountWithAutoFund(server, publicKey);

      const usdcBal2 = account.balances.find(
        (b: any) => b.asset_code === USDC_ASSET_CODE && b.asset_issuer === usdcIssuer,
      );
      if (!usdcBal2 || parseFloat(usdcBal2.balance) < numAmount) throw new Error("Insufficient USDC balance");

      const usdcAsset = new StellarSdk.default.Asset(USDC_ASSET_CODE, usdcIssuer);
      const transaction = new StellarSdk.default.TransactionBuilder(account, {
        fee: StellarSdk.default.BASE_FEE,
        networkPassphrase,
      })
        .addOperation(StellarSdk.default.Operation.payment({ destination: trimmedAddress, asset: usdcAsset, amount: numAmount.toString() }))
        .setTimeout(30)
        .build();

      transaction.sign(keypair);
      const result = await server.submitTransaction(transaction);
      console.log("USDC transfer successful:", result.hash);

      await supabaseClient.from("transactions").insert({
        user_id: wallet.user_id,
        type: "usdc_transfer",
        amount: numAmount,
        currency: "USDC",
        status: "completed",
        payment_method: "stellar",
        notes: `Sent to ${trimmedAddress.substring(0, 8)}...${trimmedAddress.substring(trimmedAddress.length - 8)}`,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Successfully sent ${numAmount} USDC`,
          transactionHash: result.hash,
          stellarExplorerUrl: `https://stellar.expert/explorer/${explorerNetwork}/tx/${result.hash}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    if (action === "get_test_usdc") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "To get test USDC on Stellar testnet, please use the Stellar Laboratory or a testnet USDC faucet.",
          instructions: [
            "1. Visit https://laboratory.stellar.org",
            "2. Go to 'Build Transaction'",
            `3. Add a trustline for USDC (issuer: ${USDC_ISSUER})`,
            "4. Use testnet faucets to get test USDC",
          ],
          publicKey,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("Error in stellar-usdc-transfer:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
