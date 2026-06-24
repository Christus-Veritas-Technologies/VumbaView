import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env } from "@vva/env/server";
import { errorHandler } from "./middleware/error-handler";
import { initWhatsApp } from "./lib/whatsapp";
import health from "./routes/health";
import auth from "./routes/auth";
import students from "./routes/students";
import staff from "./routes/staff";
import settings from "./routes/settings";
import payments from "./routes/payments";
import dashboard from "./routes/dashboard";
import reports from "./routes/reports";
import admissions from "./routes/admissions";
import contact from "./routes/contact";
import verify from "./routes/verify";

const app = new Hono();

// Fire-and-forget: starting the WhatsApp/Chromium session can take a while
// (or fail if it's never been authenticated) and must never delay Bun from
// serving HTTP traffic.
void initWhatsApp();

// One log line per request (method, path, status, duration) — makes prod
// logs useful for diagnosing issues without per-route instrumentation.
app.use("*", logger());

app.use(
  "*",
  cors({
    origin: env.CORS_ORIGIN,
  }),
);

app.route("/health", health);
app.route("/auth", auth);
app.route("/students", students);
app.route("/staff", staff);
app.route("/settings", settings);
app.route("/payments", payments);
app.route("/dashboard", dashboard);
app.route("/reports", reports);
app.route("/admissions", admissions);
app.route("/contact", contact);
app.route("/verify", verify);

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError(errorHandler);

export default app;
