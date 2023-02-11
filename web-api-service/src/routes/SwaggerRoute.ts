import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import SwaggerOptions from '../../swagger/SwaggerOption';
import { Router } from "express";
import { Routes } from "../interfaces/RouteInterface";

/**
 * Router for swagger
 */
class SwaggerRoute implements Routes {
  path = "/api-docs";
  router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    const specs = swaggerJsdoc(SwaggerOptions);
    this.router.use("/",
      swaggerUi.serve,
      swaggerUi.setup(specs));
  }
}

export default SwaggerRoute;
