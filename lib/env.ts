import { z } from "zod";

const optionalString = z.preprocess(
  (v) => (v === "" || v === undefined ? undefined : v),
  z.string().optional(),
);

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
  MONGODB_URI: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: optionalString,
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD_HASH: z.string().min(20),
  RESEND_API_KEY: optionalString,
  NOTIFY_EMAIL: optionalString,
  EMAIL_FROM: optionalString,
  OPENAI_API_KEY: optionalString,
  GEMINI_API_KEY: optionalString,
  LLM_PROVIDER: z.enum(["openai", "gemini"]).optional(),
  TURNSTILE_SECRET_KEY: optionalString,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalString,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let parsed: ServerEnv | null = null;

/** Validate and cache env at process level. Call from server code only. */
export function getServerEnv(): ServerEnv {
  if (parsed) return parsed;
  const res = serverEnvSchema.safeParse(process.env);
  if (!res.success) {
    const msg = res.error.flatten().fieldErrors;
    throw new Error(`Invalid environment: ${JSON.stringify(msg)}`);
  }
  parsed = res.data;
  return res.data;
}

export function getLlmProvider(): "openai" | "gemini" {
  const env = getServerEnv();
  if (env.LLM_PROVIDER === "gemini") return "gemini";
  if (env.LLM_PROVIDER === "openai") return "openai";
  if (env.GEMINI_API_KEY && !env.OPENAI_API_KEY) return "gemini";
  return "openai";
}
