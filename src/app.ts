import express from "express";
import routes from "./routes";
import fs from "fs";
import path from "path";
import YAML from "yaml";
import swaggerUi from "swagger-ui-express";
import cors from "cors";

import { errorHandler } from "./middlewares/error.middleware";
import { notFound } from "./middlewares/not-found.middleware";
import { env } from "./config/env";

const openapiSpec = YAML.parse(
  fs.readFileSync(path.join(__dirname, "../docs/openapi.yaml"), "utf8"),
);

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: (requestOrigin, callback) => {
      // Credentialed CORS must never use a wildcard allow-list entry.
      if (env.corsOrigins.includes("*")) {
        callback(new Error("CORS_ORIGINS must not include * with credentials"));
        return;
      }
      if (!requestOrigin) {
        callback(null, true);
        return;
      }
      if (env.corsOrigins.includes(requestOrigin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }),
);
app.use("/api", routes);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use(notFound);
app.use(errorHandler);

export default app;
