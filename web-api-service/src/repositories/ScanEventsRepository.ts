import { v4 as uuidv4 } from 'uuid';
import { dbClientPool } from '../database/DatabaseConnector';
import ScanEventsRepositoryModel, { ScanEventResultWrapper } from "../models/repositories/ScanEventsRepositoryModel";
import * as path from "path";
import logger from '../logger/WinstonLogger';
const file = path.basename(__filename);

/**
 * Scan events repostiory
 */
class ScanEventsRepository {
  private INSERT_QUEDED_EVENT = `INSERT INTO scan_events 
  (id, repository_name, queued_at) 
  VALUES($1, $2, $3);
  `
  private GET_SCAN_EVENT = `
    SELECT 
      id,
      repository_name,
      status,
      status_code,
      queued_at,
      scan_started_at,
      scan_finished
    FROM scan_events where id = $1
  `;

  private GET_SCAN_EVENT_RESULT = `
    SELECT 
      id,
      scan_event_id,
      findings,
      scan_result,
      failed_remark,
      created_at
    FROM scan_events_result where scan_event_id = $1
  `;

  /**
   * Add a new scan event data withe status of Queued to the database.
   * 
   * @param repositoryName
   * @returns @{ScanEventsRepositoryModel}
   */
  addScanEventToQueue = async (repositoryName: string): Promise<ScanEventsRepositoryModel> => {
    logger.info(`Start adding ${repositoryName} to database`, { file });
    // Generate a unique id
    const id = uuidv4();
    const currentDate = new Date();

    // Create model for inserting data and return the result
    const scanEventModel: ScanEventsRepositoryModel = {
      id,
      repository_name: repositoryName,
      queued_at: currentDate,
    }

    await dbClientPool.query(this.INSERT_QUEDED_EVENT, [id, repositoryName, currentDate])

    logger.info(`Finish adding ${repositoryName} to database`, { file });
    return scanEventModel;
  }

  getScanEventByEventId = async (scanEventId: string): Promise<ScanEventResultWrapper> => {
    logger.info(`Start getting event data for event id [${scanEventId}] from database`, { file });
    const [scanEventDb, scanEventResultDb] = await Promise.all([
      dbClientPool.query(this.GET_SCAN_EVENT, [scanEventId]),
      dbClientPool.query(this.GET_SCAN_EVENT_RESULT, [scanEventId]),
    ]);

    logger.info(`Finished getting event data for event id [${scanEventId}] from database`, { file });
    return {
      scanEvent: scanEventDb.rowCount ? scanEventDb.rows[0] : null,
      scanEventResult: scanEventResultDb.rows,
    }
  }
}

export default ScanEventsRepository;
