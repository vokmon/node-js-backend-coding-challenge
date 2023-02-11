/**
 * Model type for Finding object
 */
export interface Finding {
  type: string,
  location: {
    path: string,
    positions: {
      begin: {
        line: number
      }
    }
  }
}

/**
 * Model type for scan event result
 */
export interface ScanEventResultRepositoryModel {
  id: string
  scan_event_id: string
  findings: Finding[]
  scan_result: boolean
  failed_remark: string
  created_at: Date
}