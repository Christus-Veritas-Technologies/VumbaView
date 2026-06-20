import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "@vva/env/server";
import { errorHandler } from "./middleware/error-handler";
import health from "./routes/health";
import auth from "./routes/auth";
import students from "./routes/students";
import staff from "./routes/staff";
import settings from "./routes/settings";
import payments from "./routes/payments";
import dashboard from "./routes/dashboard";

const app = new Hono();

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

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError(errorHandler);

export default app;
