import { createServer } from "node:http";
import { createApp } from "./app.js";
import { loadEnvironment } from "./config/environment.js";
import { connectDatabase } from "./database/mongoose.js";
import { logger } from "./observability/logger.js";

const environment = loadEnvironment();
const server = createServer(createApp(environment));

const start = async () => {
  await connectDatabase(environment.MONGODB_URI);
  server.listen(environment.API_PORT, environment.API_HOST, () => {
    logger.info(`ERP API listening on http://${environment.API_HOST}:${environment.API_PORT}`);
  });
};

start().catch((error) => {
  logger.fatal({ err: error }, "No fue posible iniciar la API");
  process.exitCode = 1;
});