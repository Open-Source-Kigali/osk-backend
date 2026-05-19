import app from "./app";
import { env } from "./config/env";
if (!env.adminApiKey) {
  console.warn(
    "WARNING: ADMIN_API_KEY is not set. All admin endpoints will return 500.",
  );
}
// if (!env.adminApiKey) {
//   console.error('FATAL: ADMIN_API_KEY is not set. Refusing to start.')
//   process.exit(1)
// }
app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
