import app from "./app";
import { env } from "./config/env";

if (env.nodeEnv === "production" && env.corsOrigins.length === 0) {
  console.warn(
    "WARNING: CORS_ORIGINS is empty. Credentialed admin session requests will be rejected.",
  );
}

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
