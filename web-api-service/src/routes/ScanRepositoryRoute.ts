import IndexController from "../controllers/IndexController";
import { Router } from "express";
import { Routes } from "../interfaces/RouteInterface";
import ScanRepositoryController from "../controllers/ScanRepositoryController";

/**
   * @swagger
   * tags:
   *   name: ScanEvents
   *   description: Scan events
   */
/**
 * @swagger
 * /scan-events/trigger:
 *   post:
 *     summary: A user can trigger a scan event
 *     tags: [ScanEvents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             example:
 *              repositoryName: test-repository
 *     responses:
 *       200:
 *         description: Successfully request to scan the specific repository.
 *
 */

/**
* @swagger
* tags:
*   name: ScanEvents
*   description: Get scan event result
*/
/**
 * @swagger
 * /scan-events/results/{eventId}:
 *   get:
 *     summary: A user can view a scan result
 *     tags: [ScanEvents]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Scan results.
 *
 */

/**
 * Router handler for /scan-events path
 */
class ScanRepositoryRoute implements Routes {
  path = "/scan-events";
  router = Router();
  scanRepositoryController = new ScanRepositoryController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post("/trigger", this.scanRepositoryController.trigger);
    this.router.get("/results/:eventId", this.scanRepositoryController.getResult);
  }
}

export default ScanRepositoryRoute;
