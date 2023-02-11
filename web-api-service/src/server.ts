/* tslint:disable no-console */
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import * as http from "http";
import cors from "cors";
import { Routes } from "./interfaces/RouteInterface";
import { initDatabaseConnection } from "./database/DatabaseConnector";
import { initScanEventQueue } from "./queue/ScanEventQueue";

/**
 * Initialize routers, dependency services and start web server to lisen to the incoming requests
 */
class Server {
  app: express.Application;
  routes: Routes[] = [];
  server: http.Server;

  async setRoutes(routes: Routes[]) {
    this.routes = routes;
    await this.initService();
    this.app = express();
    this.app.use(cors());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(express.json());
    this.initializeRoutes(routes);
  }

  private async initService() {
    await Promise.all([
      initDatabaseConnection(),
      initScanEventQueue()
    ]);
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach((route) => {
      this.app.use(route.path, route.router);
    });
  }

  getServer() {
    return this.app;
  }

  close() {
    if (this.server) {
      this.server.close();
    }
  }

  listen() {
    const port = process.env.PORT || 8000;
    this.server = this.app.listen(port, async () => {
      console.log(`=================================`);
      console.log(`🚀 App listening on the port ${port}`);
      console.log("Routes");

      this.routes.forEach((r) => {
        console.log(r.path);
      });
      console.log(`=================================`);
    });
  }
}

export default Server;
