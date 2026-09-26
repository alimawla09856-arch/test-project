import "server-only";
import { z } from "zod";
import { DEV_SESSION_SECRET } from "@/lib/auth/secret";

/**
 * Server configuration, parsed once from `process.env`.
 *
 * Every integration is optional so the platform runs end-to-end on a laptop
 * with zero setup (local JSON store + rule-based estimator + no n8n). Each
 * integration switches on as soon as its variables are present.
 */

const flag = z
  .enum(["true", "false", "1", "0", "yes", "no", "on", "off"])
  .transform((value) => ["true", "1", "yes", "on"].includes(value));

const list = z.string().transform((value) =>
  value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean),
);

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SITE_URL: z.url().default("https://asdesignlb.com"),

  // Admin access
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters").optional(),
  ADMIN_EMAIL: z.email().optional(),
  ADMIN_PASSWORD_HASH: z.string().startsWith("scrypt.").optional(),
  ADMIN_USERS: z.string().optional(),

  // Data store
  DATA_STORE: z.enum(["supabase", "local"]).optional(),
  SUPABASE_URL: z.url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  LOCAL_DATA_DIR: z.string().default(".data"),

  // AI
  AI_PROVIDER: z.enum(["anthropic", "openai", "heuristic"]).optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-opus-5"),
  AI_EFFORT: z.enum(["low", "medium", "high", "xhigh", "max"]).default("high"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-5.5"),
  AI_FALLBACK_TO_HEURISTIC: flag.default(true),
  ANALYSIS_RUNNER: z.enum(["n8n", "app"]).optional(),

  // n8n
  N8N_WEBHOOK_BASE_URL: z.url().optional(),
  N8N_WEBHOOK_SECRET: z.string().min(16).optional(),
  N8N_CALLBACK_SECRET: z.string().min(16).optional(),
  N8N_WEBHOOK_LEAD_INTAKE: z.url().optional(),
  N8N_WEBHOOK_ANALYSIS: z.url().optional(),
  N8N_WEBHOOK_DISPATCH: z.url().optional(),
  N8N_WEBHOOK_CRM_SYNC: z.url().optional(),
  N8N_CRM_SYNC_ENABLED: flag.default(true),

  // Security & limits
  ALLOWED_ORIGINS: list.default([]),
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  IP_HASH_SALT: z.string().optional(),
  ONBOARD_MIN_FILL_SECONDS: z.coerce.number().int().min(0).default(4),
});

export type AiProvider = "anthropic" | "openai" | "heuristic";

export interface AdminUser {
  email: string;
  passwordHash: string;
}

export interface ServerConfig {
  isProduction: boolean;
  appUrl: string;
  siteUrl: string;
  sessionSecret: string;
  admins: AdminUser[];
  /** Development-only demo login when no admin is configured. */
  devLogin: { email: string; password: string } | null;
  dataStore: "supabase" | "local";
  supabase: { url: string; serviceRoleKey: string } | null;
  localDataDir: string;
  ai: {
    provider: AiProvider;
    anthropic: { apiKey: string; model: string } | null;
    openai: { apiKey: string; model: string } | null;
    effort: "low" | "medium" | "high" | "xhigh" | "max";
    fallbackToHeuristic: boolean;
  };
  analysisRunner: "n8n" | "app";
  n8n: {
    enabled: boolean;
    webhookSecret: string | null;
    callbackSecret: string | null;
    crmSyncEnabled: boolean;
    urls: { leadIntake: string | null; analysis: string | null; dispatch: string | null; crmSync: string | null };
  };
  allowedOrigins: string[];
  upstash: { url: string; token: string } | null;
  ipHashSalt: string;
  onboardMinFillMs: number;
  warnings: string[];
}

function parseAdminUsers(raw: string | undefined): AdminUser[] {
  if (!raw) return [];
  return raw
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((entry) => {
      const separator = entry.indexOf(":");
      return { email: entry.slice(0, separator).trim().toLowerCase(), passwordHash: entry.slice(separator + 1).trim() };
    })
    .filter((user) => user.email.includes("@") && user.passwordHash.startsWith("scrypt."));
}

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function buildConfig(): ServerConfig {
  // Treat empty strings (`FOO=` in .env files) as unset.
  const raw = Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== undefined && value !== ""));
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  const e = parsed.data;
  const isProduction = e.NODE_ENV === "production";
  const warnings: string[] = [];

  let sessionSecret = e.SESSION_SECRET;
  if (!sessionSecret) {
    if (isProduction) throw new Error("SESSION_SECRET is required in production (min 32 characters).");
    sessionSecret = DEV_SESSION_SECRET;
    warnings.push("SESSION_SECRET is not set — using an insecure development secret.");
  }

  const admins = parseAdminUsers(e.ADMIN_USERS);
  if (e.ADMIN_EMAIL && e.ADMIN_PASSWORD_HASH) {
    admins.unshift({ email: e.ADMIN_EMAIL.toLowerCase(), passwordHash: e.ADMIN_PASSWORD_HASH });
  }
  const devLogin = !isProduction && admins.length === 0 ? { email: "demo@asdesignlb.com", password: "studio-demo" } : null;
  if (devLogin) warnings.push("No admin configured — development demo login is enabled.");
  if (isProduction && admins.length === 0) {
    warnings.push("No admin users configured (ADMIN_EMAIL + ADMIN_PASSWORD_HASH) — the dashboard is inaccessible.");
  }

  const supabase =
    e.SUPABASE_URL && e.SUPABASE_SERVICE_ROLE_KEY ? { url: e.SUPABASE_URL, serviceRoleKey: e.SUPABASE_SERVICE_ROLE_KEY } : null;
  const dataStore = e.DATA_STORE ?? (supabase ? "supabase" : "local");
  if (dataStore === "supabase" && !supabase) {
    throw new Error("DATA_STORE=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  if (dataStore === "local") {
    warnings.push("Using the local file store — configure Supabase for multi-instance / serverless deployments.");
  }

  const anthropic = e.ANTHROPIC_API_KEY ? { apiKey: e.ANTHROPIC_API_KEY, model: e.ANTHROPIC_MODEL } : null;
  const openai = e.OPENAI_API_KEY ? { apiKey: e.OPENAI_API_KEY, model: e.OPENAI_MODEL } : null;
  let provider: AiProvider = e.AI_PROVIDER ?? (anthropic ? "anthropic" : openai ? "openai" : "heuristic");
  if (provider === "anthropic" && !anthropic) {
    warnings.push("AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is missing — using the rule-based estimator.");
    provider = "heuristic";
  }
  if (provider === "openai" && !openai) {
    warnings.push("AI_PROVIDER=openai but OPENAI_API_KEY is missing — using the rule-based estimator.");
    provider = "heuristic";
  }

  const base = e.N8N_WEBHOOK_BASE_URL;
  const urls = {
    leadIntake: e.N8N_WEBHOOK_LEAD_INTAKE ?? (base ? joinUrl(base, "asd-lead-intake") : null),
    analysis: e.N8N_WEBHOOK_ANALYSIS ?? (base ? joinUrl(base, "asd-ai-analysis") : null),
    dispatch: e.N8N_WEBHOOK_DISPATCH ?? (base ? joinUrl(base, "asd-proposal-dispatch") : null),
    crmSync: e.N8N_WEBHOOK_CRM_SYNC ?? (base ? joinUrl(base, "asd-crm-sync") : null),
  };
  const n8nEnabled = Object.values(urls).some(Boolean);
  if (n8nEnabled && !e.N8N_WEBHOOK_SECRET) {
    warnings.push("n8n webhooks are configured but N8N_WEBHOOK_SECRET is missing — requests to n8n are unauthenticated.");
  }
  if (n8nEnabled && !e.N8N_CALLBACK_SECRET) {
    warnings.push("N8N_CALLBACK_SECRET is missing — n8n cannot call back into /api/v1 (proposals, events).");
  }

  const analysisRunner = e.ANALYSIS_RUNNER ?? (urls.leadIntake && urls.analysis ? "n8n" : "app");

  return {
    isProduction,
    appUrl: e.NEXT_PUBLIC_APP_URL.replace(/\/+$/, ""),
    siteUrl: e.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, ""),
    sessionSecret,
    admins,
    devLogin,
    dataStore,
    supabase,
    localDataDir: e.LOCAL_DATA_DIR,
    ai: { provider, anthropic, openai, effort: e.AI_EFFORT, fallbackToHeuristic: e.AI_FALLBACK_TO_HEURISTIC },
    analysisRunner,
    n8n: {
      enabled: n8nEnabled,
      webhookSecret: e.N8N_WEBHOOK_SECRET ?? null,
      callbackSecret: e.N8N_CALLBACK_SECRET ?? null,
      crmSyncEnabled: e.N8N_CRM_SYNC_ENABLED,
      urls,
    },
    allowedOrigins: e.ALLOWED_ORIGINS,
    upstash:
      e.UPSTASH_REDIS_REST_URL && e.UPSTASH_REDIS_REST_TOKEN
        ? { url: e.UPSTASH_REDIS_REST_URL, token: e.UPSTASH_REDIS_REST_TOKEN }
        : null,
    ipHashSalt: e.IP_HASH_SALT ?? sessionSecret,
    onboardMinFillMs: e.ONBOARD_MIN_FILL_SECONDS * 1000,
    warnings,
  };
}

let cached: ServerConfig | null = null;

export function getConfig(): ServerConfig {
  if (!cached) {
    cached = buildConfig();
    for (const warning of cached.warnings) console.warn(`[config] ${warning}`);
  }
  return cached;
}

/** Test helper — forces the next `getConfig()` call to re-read `process.env`. */
export function resetConfigForTests() {
  cached = null;
}
