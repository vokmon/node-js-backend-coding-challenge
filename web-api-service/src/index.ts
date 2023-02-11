import Server from "./server";
import IndexRoute from "./routes/IndexRoute";
import SwaggerRoute from "./routes/SwaggerRoute";
import ScanRepositoryRoute from "./routes/ScanRepositoryRoute";

const indexRoute = new IndexRoute();
const swaggerRoute = new SwaggerRoute();
const scanRepositoryRoute = new ScanRepositoryRoute();

/**
 * Start server function
 */
const startServer = async () => {
  const server = new Server();
  await server.setRoutes([
    indexRoute,
    scanRepositoryRoute,
    swaggerRoute,
  ]);
  await server.listen();
};

startServer();
