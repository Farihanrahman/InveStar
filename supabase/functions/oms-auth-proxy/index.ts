import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const normalizeBaseUrl = (raw: unknown): string | undefined => {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  try {
    const withProtocol = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);

    // Security: avoid turning this into a generic open proxy.
    // Allow only expected OMS hostnames.
    const hostname = url.hostname.toLowerCase();
    const allowed = hostname.endsWith("trycloudflare.com") || hostname.endsWith("investar.com");

    if (url.protocol !== "https:" || !allowed) return undefined;

    // origin strips any path/query that a user might paste
    return url.origin;
  } catch {
    return undefined;
  }
};

// Default base URL (can be overridden per-request via `baseUrlOverride`)
const DEFAULT_OMS_API_BASE_URL_RAW = Deno.env.get("OMS_API_BASE_URL") ?? "oms-investar-authapi.dev.sandbox3000.com";

const DEFAULT_OMS_API_BASE_URL =
  normalizeBaseUrl(DEFAULT_OMS_API_BASE_URL_RAW) ??
  (DEFAULT_OMS_API_BASE_URL_RAW.startsWith("http")
    ? DEFAULT_OMS_API_BASE_URL_RAW
    : `https://${DEFAULT_OMS_API_BASE_URL_RAW}`);

const APP_ID = Deno.env.get("OMS_APP_ID") ?? "InvestarOMS";
const OMS_API_VERSION = Deno.env.get("OMS_API_VERSION") ?? "v1";

type ProxyAction = "login" | "auto_login" | "get_social_login_url";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildOmsHeaders(req: Request) {
  const tz = req.headers.get("Timezone") ?? "UTC";
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "app-id": APP_ID,
    "X-API-VERSION": OMS_API_VERSION,
    Timezone: tz,
    "ngrok-skip-browser-warning": "true",
  };
}

async function detectSocialUrl(baseUrl: string, provider: string, redirectUrl: string, req: Request) {
  const candidates = [
    // Variant used by the current Auth.tsx
    `${baseUrl}/login-social/${provider}?frontend_redirect_url=${encodeURIComponent(redirectUrl)}`,
    // Variant used by authService.getSocialLoginUrl()
    `${baseUrl}/auth/api/v1/login-social/${provider}?frontend_redirect_url=${encodeURIComponent(redirectUrl)}`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: "GET",
        redirect: "manual",
        headers: buildOmsHeaders(req),
      });

      const location = res.headers.get("location");
      if ((res.status >= 300 && res.status < 400 && location) || (location && location.length > 0)) {
        return url;
      }
    } catch {
      // ignore and try next
    }
  }

  // Fall back to first candidate
  return candidates[0];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action as ProxyAction | undefined;
    const payload = body?.payload as Record<string, unknown> | undefined;
    const baseUrlOverride = normalizeBaseUrl(body?.baseUrlOverride);
    const omsBaseUrl = baseUrlOverride ?? DEFAULT_OMS_API_BASE_URL;

    if (!action) {
      return jsonResponse({ error: "Missing action" }, 400);
    }

    if (action === "get_social_login_url") {
      const provider = String(payload?.provider ?? "");
      const redirectUrl = String(payload?.redirectUrl ?? "");

      if (!provider || !redirectUrl) {
        return jsonResponse({ error: "Missing provider or redirectUrl" }, 400);
      }

      const url = await detectSocialUrl(omsBaseUrl, provider, redirectUrl, req);
      return jsonResponse({ url });
    }

    // Proxy OMS auth endpoints
    let path = "";
    if (action === "login") path = "/auth/api/v1/login";
    if (action === "auto_login") path = "/auth/api/v1/auto-login";

    if (!path) {
      return jsonResponse({ error: `Unsupported action: ${action}` }, 400);
    }

    const upstreamUrl = `${omsBaseUrl}${path}`;

    const upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: buildOmsHeaders(req),
      body: JSON.stringify(payload ?? {}),
    });

    const text = await upstreamRes.text();

    // OMS sometimes returns non-JSON error bodies; pass through as best effort.
    try {
      const data = text ? JSON.parse(text) : null;
      return jsonResponse(data, upstreamRes.status);
    } catch {
      return jsonResponse({ raw: text }, upstreamRes.status);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[oms-auth-proxy] Error:", message);
    return jsonResponse(
      {
        error: message,
        hint: "Upstream OMS may be unreachable from the backend as well.",
      },
      502,
    );
  }
});
