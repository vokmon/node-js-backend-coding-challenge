import HttpStatus from "http-status-codes";
import { Request, Response } from "express";
import logger from "../logger/WinstonLogger";
import * as path from "path";
const file = path.basename(__filename);

class IndexController {
  /**
   * Get server statue
   * @param _req 
   * @param res 
   */
  getStatus = async (_req: Request, res: Response): Promise<void> => {
    logger.info("Index route", { file });
    res.status(HttpStatus.OK).send({
      status: "ok",
    });
  };
}

export default IndexController;
