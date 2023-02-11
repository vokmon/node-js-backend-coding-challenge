/**
 * Model type for Finding object
 */
export interface ScanResultDetailFinding {
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

export interface ScanResultDetail {
  id: string
  findings?: ScanResultDetailFinding[]
  scanResult: boolean
  failedRemark: string
  createdAt: Date
}

interface ScanResultResponse {
  id: string
  repositoryName: string
  status?: string
  queuedAt?: Date
  scanStartedAt?: Date
  scanFinished?: Date
  scanResultDetail: ScanResultDetail[]
}

export default ScanResultResponse;