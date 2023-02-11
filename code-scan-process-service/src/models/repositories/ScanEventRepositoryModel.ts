/**
 * Scan event statuses of the application
 */
export enum ScanEventStatus {
  Queued = 'Queued',
  InProgress = 'In Progress',
  Success = 'Success',
  Failure = 'Failure',
}

/**
 * Repository model for ScanEvent data
 */
export interface ScanEventRepositoryModel {
  id: string
  repository_name: string
  status: string
  queued_at: Date
  scan_started_at: Date
  scan_finished: Date
}

