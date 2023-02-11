import * as path from "path";
import { v4 as uuidv4 } from 'uuid';
const file = path.basename(__filename);
import { dbClientPool } from '../database/DatabaseConnector';
import logger from '../logger/WinstonLogger';
import { ScanEventRepositoryModel } from "../models/repositories/ScanEventRepositoryModel";
import { ScanRepositoryResult } from "../models/services/ScanRepositoryResult";

class ScanEventsResultRepository {
  UPDATE_SCAN_EVENT_DATA_TO_FINISH = `
    UPDATE scan_events
    SET 
      status = $1,
      scan_finished = $2
    WHERE id = $3
  `

  ADD_SCAN_EVENT_RESULT = `
    INSERT INTO scan_events_result (
      id,
      scan_event_id,
      findings,
      scan_result,
      failed_remark,
      created_at
    )
    VALUES($1, $2, $3, $4, $5, $6);

  `
  /**
   * Save the scan event result and update scan event data when the scan successfully finished
   * @param scanEventData scan event data
   * @param scanRepositoryResult scan repository result
   */
  async saveScanEventsResult(scanEventData: ScanEventRepositoryModel, scanRepositoryResult: ScanRepositoryResult) {
    await dbClientPool.queryWithTransaction(async (client) => {
      const currentDate = new Date();
      const scanResultId = uuidv4();

      logger.info(`Start saving scan event data and the result for scan event ${scanEventData.id}.`, { file });
      logger.debug(`Data to save: \nScanEventData: ${JSON.stringify(scanEventData)}\nScanEventResultData: ${JSON.stringify(scanRepositoryResult)}`, { file })
      await Promise.all([
        client.query(this.UPDATE_SCAN_EVENT_DATA_TO_FINISH, [
          scanEventData.status,
          currentDate,
          scanEventData.id,
        ]),
        client.query(this.ADD_SCAN_EVENT_RESULT, [
          scanResultId,
          scanEventData.id,
          scanRepositoryResult?.findings? JSON.stringify(scanRepositoryResult?.findings) : null,
          true, // indicate the process can finished
          null, // the process run successfully, no failed remark
          currentDate
        ])
      ]);

      logger.info(`Successfully save scan event data and the result for scan event [${scanEventData.id}] and scan event result [${scanResultId}].`, { file })
    });
  }

  /**
   * Save the scan event result and update scan event data when the scan failed finished
   * 
   * @param scanEventData scan event data
   * @param scanRepositoryResult scan repository result
   * @param errorMessage reason the scan is failed
   */
  async saveScanEventFailedToScan(
    scanEventData: ScanEventRepositoryModel,
    scanRepositoryResult: ScanRepositoryResult,
    errorMessage: string,
  ) {
    await dbClientPool.queryWithTransaction(async (client) => {
      logger.info(`Start saving failed scan event data and the result for scan event ${scanEventData.id} with failed remark '${errorMessage}'.`, { file });
      logger.debug(`Data to save: \nScanEventData: ${JSON.stringify(scanEventData)}\nScanEventResultData: ${JSON.stringify(scanRepositoryResult)}\nError message: ${errorMessage}`, { file })
      
      const currentDate = new Date();
      const scanResultId = uuidv4();
      await client.query(this.ADD_SCAN_EVENT_RESULT, [
        scanResultId,
        scanEventData.id,
        scanRepositoryResult?.findings? JSON.stringify(scanRepositoryResult?.findings) : null,
        false, // indicate the process can finished
        errorMessage,
        currentDate
      ]);

      logger.info(`Start saving failed scan event data and the result for scan event [${scanEventData.id}] and scan result id [${scanResultId}] with failed remark '${errorMessage}'.`, { file });
      
    });
  }
}

export default ScanEventsResultRepository;