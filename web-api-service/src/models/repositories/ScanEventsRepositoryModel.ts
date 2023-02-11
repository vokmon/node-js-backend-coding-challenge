/**
 * Model for ScanEventsRepository
 */

import { ScanEventResultRepositoryModel } from "./ScanEventResultRepositoryModel"

/**
 * Repository model for ScanEvent data
 */
interface ScanEventsRepositoryModel {
  id: string
  repository_name: string
  status?: string
  queued_at?: Date
  scan_started_at?: Date
  scan_finished?: Date
}

export interface ScanEventResultWrapper {
  scanEvent: ScanEventsRepositoryModel,
  scanEventResult: ScanEventResultRepositoryModel[],
}

export default ScanEventsRepositoryModel;
