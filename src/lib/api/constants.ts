/**
 * API Configuration Constants
 * Similar to Vue.js project's consts.js but adapted for React/TypeScript
 */

import type { ServiceName } from "./types";

export interface ServiceConfig {
  API_BASE_PROTOCOL: string;
  API_BASE_DOMAIN: string;
  API_SUFFIX: string;
}

/**
 * Get base URL for a service
 */
export const getApiBaseUrl = (serviceName: ServiceName = "default"): string => {
  const OMS_OVERRIDE_KEY = "OMS_API_BASE_URL_OVERRIDE";

  let baseUrl = import.meta.env.VITE_OMS_API_BASE_URL || "localhost";

  // Runtime override (useful when tunnels/domains change without redeploy)
  if (typeof window !== "undefined") {
    const override = localStorage.getItem(OMS_OVERRIDE_KEY) || localStorage.getItem("API_BASE_DOMAIN");
    if (override && override.trim()) {
      baseUrl = override.trim();
    }
  }

  const protocol = baseUrl.startsWith("http") ? "" : "https://";
  return `${protocol}${baseUrl}`;
};

/**
 * Get full API URL for a service
 */
export const getApiUrl = (serviceName: ServiceName = "default"): string => {
  const baseUrl = getApiBaseUrl(serviceName);

  // Service-specific suffixes
  const suffixes: Record<ServiceName, string> = {
    default: "api/v1",
    oms: "api",
    itch: "api",
  };

  return `${baseUrl}/${suffixes[serviceName]}`;
};

/**
 * Application ID
 */
export const APP_ID = import.meta.env.VITE_OMS_APP_ID || "InvestarOMS";

/**
 * OMS API Version
 */
export const OMS_API_VERSION = import.meta.env.VITE_OMS_API_VERSION || "v1";

/**
 * Get local timezone
 */
export const getLocalTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
};
