import HttpStatus from "http-status-codes";
import { Request, Response } from "express";
import logger from "../logger/WinstonLogger";
import ScanTriggerModel from "../models/requests/ScanTriggerModel";
import ScanEventsRepository from "../repositories/ScanEventsRepository";
import * as path from "path";
import ScanEventQueue from "../queue/ScanEventQueue";
import ScanEventsRepositoryModel from "../models/repositories/ScanEventsRepositoryModel";
import TriggerScanResponse from "../models/responses/TriggerScanResponse";
import ScanResultResponse, { ScanResultDetail, ScanResultDetailFinding } from "../models/responses/ScanResultResponse";
import { ScanEventResultRepositoryModel } from "../models/repositories/ScanEventResultRepositoryModel";
const file = path.basename(__filename);

class ScanRepositoryController {
  scanEventsRepository = new ScanEventsRepository();

  /**
   * Trigger a scan event
   * @param req
   * @param res 
   * @returns the scan event details
   */
  trigger = async (req: Request<{}, {}, ScanTriggerModel>, res: Response): Promise<void> => {
    logger.info("Start trigger scan route", { file });
    const { repositoryName } = req.body;
    try {

      if (!repositoryName || repositoryName.trim().length === 0) {
        res.status(HttpStatus.BAD_REQUEST).send('Please specify repositoryName in the request body.');
        return;
      }

      // Create a new record in the database
      const result: ScanEventsRepositoryModel = await this.scanEventsRepository.addScanEventToQueue(repositoryName);
      const response: TriggerScanResponse = {
        id: result.id,
        repositoryName: result.repository_name,
        queuedAt: result.queued_at,
      }

      // Add the request into the queue to be run in the background process
      ScanEventQueue.addMessage(result.id);

      logger.info(`Successfully adding repository "${repositoryName}" in to the queue\n ${JSON.stringify(result)}`, { file })
      res.status(HttpStatus.OK).send(response);
    } catch (e) {
      const errorMessage = `An error occur while adding ${repositoryName} into the queue.`;
      logger.error(errorMessage, { error: e, file });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(errorMessage);
    }
  };

  /**
   * Get scan event result
   * @param req 
   * @param res 
   * @returns Scan event results
   */
  getResult = async (req: Request, res: Response): Promise<void> => {
    logger.info("Start trigger scan route", { file });
    const { eventId } = req.params;
    try {
      logger.info(`Event id to get result: ${eventId}`, { file });

      const {
        scanEvent,
        scanEventResult,
      } = await this.scanEventsRepository.getScanEventByEventId(eventId);

      if (!scanEvent) {
        res.status(HttpStatus.NOT_FOUND).send(`Data for the event id ${eventId} is not found.`);
        return;
      }

      const scanResultDetails = scanEventResult.map((scanEventResult: ScanEventResultRepositoryModel) => {
        const result: ScanResultDetail = {
          id: scanEventResult.id,
          findings: scanEventResult?.findings?.map((finding) => {
            const result: ScanResultDetailFinding = {...finding}
            return result;
          }),
          scanResult: scanEventResult.scan_result,
          failedRemark: scanEventResult.failed_remark,
          createdAt: scanEventResult.created_at
        }
        return result;
      })
      const result: ScanResultResponse = {
        id: scanEvent.id,
        repositoryName: scanEvent.repository_name,
        status: scanEvent.status,
        queuedAt: scanEvent.queued_at,
        scanStartedAt: scanEvent.scan_started_at,
        scanFinished: scanEvent.scan_finished,
        scanResultDetail: scanResultDetails,
      };

      res.status(HttpStatus.OK).send(result);
    } catch (e) {
      const errorMessage = `An error occur while getting result for event id ${eventId}.`;
      logger.error(errorMessage, { error: e, file });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(errorMessage);
    }

  };
}

export default ScanRepositoryController;
