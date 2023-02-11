/**
 * Model for trigger scan response
 */
interface TriggerScanResponse {
  id: string;
  repositoryName: string;
  queuedAt: Date;
}

export default TriggerScanResponse;