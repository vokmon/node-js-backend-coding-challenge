import { dbClientPool } from '../database/DatabaseConnector';
import * as path from "path";
import logger from '../logger/WinstonLogger';
import { ScanEventStatus, ScanEventRepositoryModel } from '../models/repositories/ScanEventRepositoryModel';
import ScanEventNotFoundException from '../exceptions/ScanEventNotFoundException';
import ScanEventNotInQueuedStatusException from '../exceptions/ScanEventNotInQueuedStatusException';
const file = path.basename(__filename);

/**
 * Scan events repostiory
 */
class ScanEventsRepository {
  private SELECT_SCAN_EVENT_BY_ID_WITH_NO_LOCK = `
  SELECT 
    id,
    repository_name,
    status,
    queued_at,
    scan_started_at,
    scan_finished
  FROM scan_events 
  WHERE id = $1
  `;

  private SELECT_SCAN_EVENT_BY_ID_WITH_LOCK = `
  ${this.SELECT_SCAN_EVENT_BY_ID_WITH_NO_LOCK} 
  FOR UPDATE
  `;

  private UPDATE_SCAN_EVENT_STATUS_TO_IN_PROGRESS = `
  UPDATE scan_events 
  SET 
    status = '${ScanEventStatus.InProgress.valueOf()}',
    scan_started_at = $1
    WHERE id = $2
  `

  /**
   * Update scan event to In Progress status
   * During the process the row of the scan event is locked at the record level.
   * This is to prevent the case more than 1 processes is trying to access the same record.
   * The lock is released when the transation is completed.
   * 
   * @param scanEventId the scan event id
   * @returns scan event object
   */
  updateScanEventToInProgress = async (scanEventId: string): Promise<ScanEventRepositoryModel> => {
    return await dbClientPool.queryWithTransaction(async (query) => {
      // Validate the scan event. If the scan event is not found, no need to continue.
      const scanEvent = await query.query(this.SELECT_SCAN_EVENT_BY_ID_WITH_LOCK, [scanEventId]);
      logger.info(`Scan event data for ${scanEventId}: ${JSON.stringify(scanEvent)}`, { file })
      if (scanEvent.rowCount === 0) {
        throw new ScanEventNotFoundException(`Scan event data for ${scanEventId} is not found.`);
      }

      // Validate the scan event status. The status must be Queued in order to move to In Progress.
      const scanEventData: ScanEventRepositoryModel = scanEvent.rows[0];
      logger.info(`Scan event data: ${JSON.stringify(scanEventData)}`);
      if (scanEventData.status !== ScanEventStatus.Queued.valueOf()) {
        throw new ScanEventNotInQueuedStatusException(`Scan event id ${scanEventId} is in Queued status.`);
      }

      await query.query(this.UPDATE_SCAN_EVENT_STATUS_TO_IN_PROGRESS, [
        new Date(),
        scanEventId
      ]);

      const updatedScanEvent = await query.query(this.SELECT_SCAN_EVENT_BY_ID_WITH_NO_LOCK, [scanEventId]);
      logger.info(`Successfully update scan event ${scanEventId} to ${ScanEventStatus.InProgress.valueOf()}`, { file })
      return updatedScanEvent.rows[0];
    });
  }
}

export default ScanEventsRepository;
