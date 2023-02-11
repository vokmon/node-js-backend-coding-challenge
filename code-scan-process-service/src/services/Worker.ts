import * as path from "path";
import ScanEventNotFoundException from "../exceptions/ScanEventNotFoundException";
import ScanEventNotInQueuedStatusException from "../exceptions/ScanEventNotInQueuedStatusException";
import logger from "../logger/WinstonLogger";
import { ScanEventRepositoryModel, ScanEventStatus } from "../models/repositories/ScanEventRepositoryModel";
import { ScanRepositoryResult } from "../models/services/ScanRepositoryResult";
import { WorkerProcessEventResult } from "../models/services/WorkerProcessEventResult";
import ScanEventsRepository from "../repositories/ScanEventsRepository";
import ScanEventsResultRepository from "../repositories/ScanEventsResultRepository";
import RepositoryScanner from "./RepositoryScanner";
const file = path.basename(__filename);

/**
 * The worker class to process the repository scan
 */
class Worker {
  scanEventsRepository: ScanEventsRepository = new ScanEventsRepository();
  scanEventsResultRepository: ScanEventsResultRepository = new ScanEventsResultRepository();

  /**
   * Process repository scan by scan event id
   * @param scanEventId 
   * @returns 
   */
  processScanEvent = async (scanEventId: string): Promise<WorkerProcessEventResult> => {
    let scanEventData: ScanEventRepositoryModel;
    let scanResult: ScanRepositoryResult;
    try {
      logger.info(`Start processing event ${scanEventId}`, { file })
      if (!scanEventId) {
        logger.error(`No scan event id. No need to process anything.`, { file })
        return {
          isSuccess: false,
          errorMessage: 'No scan event id',
        };
      }
      scanEventData = await this.scanEventsRepository.updateScanEventToInProgress(scanEventId);
      const repositoryScanner = new RepositoryScanner();
      scanResult = await repositoryScanner.scanRepository(scanEventData.repository_name);

      const scanEventDataToUpdate = { ...scanEventData };
      if (scanResult.vulnerabilityScore === 0) {
        scanEventDataToUpdate.status = ScanEventStatus.Success;
      } else {
        scanEventDataToUpdate.status = ScanEventStatus.Failure;
      }
      await this.scanEventsResultRepository.saveScanEventsResult(scanEventDataToUpdate, scanResult);
      logger.info(`\n\nFinish process the scan event id [${scanEventId}].`, { file });
      return {
        isSuccess: true,
      };
    } catch (e) {
      if (e instanceof ScanEventNotFoundException || e instanceof ScanEventNotInQueuedStatusException) {
        logger.info(e.message, { file, error: e });
      } else {
        const errorMessage = `An error occur while scanning the repository with scan event id ${scanEventId}.`;
        logger.error(errorMessage, { error: e, file })

        try {
          // Save error result
          await this.scanEventsResultRepository.saveScanEventFailedToScan(scanEventData, scanResult, e.message)

        } catch (err) {
          const errorMessage = `An error occur while saving the failed to scan data with scan event id ${scanEventId}.`;
          logger.error(errorMessage, { error: e, file })
        }

        // TODO
        // Apply the retry logic here
      }

      logger.info(`\n\nAn error occurs while processing the event id [${scanEventId}].`, { file })
      return {
        isSuccess: false,
        errorMessage: e.message,
      };
    }
  }
}

export default Worker;