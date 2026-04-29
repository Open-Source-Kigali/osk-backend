import express from "express";
import routes from "./routes";
import { errorHandler } from "./middlewares/error.middleware";
import { notFound } from "./middlewares/notFound.middleware";

const app = express();

app.use(express.json());
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
