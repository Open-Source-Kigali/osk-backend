import app from "./app";
import { env } from "./config/env";

// Startup sanity-check for the admin API key.
// Without this key, requireAdmin (src/middlewares/auth.middleware.ts) cannot
// authenticate any request and will immediately return 500. Catching the
// misconfiguration here makes the root cause obvious in the logs instead of 
// appearing as a cryptic 500 at request time.
if (!env.adminApiKey) {
  console.warn(
    "WARNING: ADMIN_API_KEY is not set. All admin endpoints will return 500."
  );
}

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
