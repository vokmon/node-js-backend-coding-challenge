import { Finding } from "../repositories/ScanEventResultRepositoryModel";

/**
 * Movel type for scan repository result in service layer
 */
export interface ScanRepositoryResult {
  vulnerabilityScore: number, findings: Finding[]
}