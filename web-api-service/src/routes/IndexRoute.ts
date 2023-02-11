import IndexController from "../controllers/IndexController";
import { Router } from "express";
import { Routes } from "../interfaces/RouteInterface";

/**
 * Router handler for index path
 */
class IndexRoute implements Routes {
  path = "/";
  router = Router();
  indexController = new IndexController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {    
    this.router.get("/", this.indexController.getStatus);
  }
}

export default IndexRoute;
