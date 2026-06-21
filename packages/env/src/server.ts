import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(16),
    PORT: z.coerce.number().default(3000),
    // Both optional: the app must boot fine with WhatsApp notifications
    // unconfigured, since these are validated eagerly at module load and a
    // missing value here would otherwise take down the whole API.
    ADMIN_WHATSAPP_NUMBER: z.string().optional(),
    CHROMIUM_URL: z.string().optional(),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
