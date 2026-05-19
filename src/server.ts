import app from "./app";
import { env } from "./config/env";

// Surface misconfiguration during startup instead of only at request time.
if (!env.adminApiKey) {
  console.warn(
    "WARNING: ADMIN_API_KEY is not set. All admin endpoints will return 500.",
  );
}

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
