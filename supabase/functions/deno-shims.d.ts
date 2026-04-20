// This repo is a Vite/TS project, but Supabase Edge Functions run on Deno.
// These shims keep the TS language service happy for Deno URL imports.

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export type Handler = (request: Request) => Response | Promise<Response>;
  export function serve(handler: Handler): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.39.3" {
  export const createClient: (...args: any[]) => any;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export const createClient: (...args: any[]) => any;
}

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve: (handler: (request: Request) => Response | Promise<Response>) => void;
};

