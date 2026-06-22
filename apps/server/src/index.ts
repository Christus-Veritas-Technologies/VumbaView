import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "@vva/env/server";
import { errorHandler } from "./middleware/error-handler";
import { initWhatsApp } from "./lib/whatsapp";
import { secretFingerprint } from "./lib/jwt";
import { authLog } from "./lib/debug-log";
import health from "./routes/health";
import auth from "./routes/auth";
import students from "./routes/students";
import staff from "./routes/staff";
import settings from "./routes/settings";
import payments from "./routes/payments";
import dashboard from "./routes/dashboard";
import admissions from "./routes/admissions";
import contact from "./routes/contact";

// Fires every time this module's top-level code runs — including on every
// `bun --hot` reload, not just a fresh process start. If two boot lines ever
// show the same pid but a *different* secret fingerprint, JWT_SECRET changed
// underneath a live process (e.g. an edited .env picked up mid-session). If
// pid changes, it's a genuinely new process (old one may still be alive on
// the same port from a previous terminal).
authLog(
  "boot",
  "pid=",
  process.pid,
  "NODE_ENV=",
  env.NODE_ENV,
  "PORT=",
  env.PORT,
  "secret=",
  secretFingerprint(),
);

const app = new Hono();

// Fire-and-forget: starting the WhatsApp/Chromium session can take a while
// (or fail if it's never been authenticated) and must never delay Bun from
// serving HTTP traffic.
void initWhatsApp();

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
app.route("/admissions", admissions);
app.route("/contact", contact);

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError(errorHandler);

export default app;
