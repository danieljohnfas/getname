declare global {
  interface CloudflareEnv {
    DB: import('@cloudflare/workers-types').D1Database;
    RATE_LIMIT_KV: import('@cloudflare/workers-types').KVNamespace;
    SERVER_PEPPER: string;
    SESSION_SECRET: string;
    TURNSTILE_SECRET_KEY: string;
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: string;
  }
}
export {};
