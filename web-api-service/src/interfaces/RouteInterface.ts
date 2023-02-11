import { Router } from "express";

/**
 * Router interface
 */
export interface Routes {
  path?: string;
  router: Router;
}
