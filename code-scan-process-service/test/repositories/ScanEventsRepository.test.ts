import dotenv from "dotenv";
dotenv.config();
import { dbClientPool, disconnectDatabase, initDatabaseConnection } from "../../src/database/DatabaseConnector";
import ScanEventsRepository from "../../src/repositories/ScanEventsRepository";
import { ScanEventStatus } from "../../src/models/repositories/ScanEventRepositoryModel";
import ScanEventNotFoundException from "../../src/exceptions/ScanEventNotFoundException";
import ScanEventNotInQueuedStatusException from "../../src/exceptions/ScanEventNotInQueuedStatusException";

describe("Test update scan event to In Progress", () => {
  const INSERT_QUEDED_EVENT = `INSERT INTO scan_events 
  (id, repository_name, status, queued_at) 
  VALUES($1, $2, $3, $4);
  `

  const DELETE_SCAN_EVENT_ID = `DELETE from scan_events where id = $1`;

  let scanEventsRepository: ScanEventsRepository;
  const scanEventIdInQueued = '3874-348-2348';
  const scanEventIdInInProgress = '0898--764-3948';

  beforeAll(async () => {
    initDatabaseConnection();
    const currentDate = new Date();
    await Promise.all([
      dbClientPool.query(INSERT_QUEDED_EVENT, [scanEventIdInQueued, 'code-scan-process-repo', ScanEventStatus.Queued, currentDate]),
      dbClientPool.query(INSERT_QUEDED_EVENT, [scanEventIdInInProgress, 'code-scan-process-repo', ScanEventStatus.InProgress, currentDate])
    ])
    scanEventsRepository = new ScanEventsRepository();
  });

  it("Scan event id not found", async () => {
    expect(scanEventsRepository.updateScanEventToInProgress('randome-event-id')).rejects.toThrow(ScanEventNotFoundException);
  });

  it("Scan event is not in Queued", async () => {
    expect(scanEventsRepository.updateScanEventToInProgress(scanEventIdInInProgress)).rejects.toThrow(ScanEventNotInQueuedStatusException);
  });

  it("Successfully Update the scan event to In Progress", async () => {
    const result = await scanEventsRepository.updateScanEventToInProgress(scanEventIdInQueued);
    expect(result.id).toEqual(result.id);
    expect(result.status).toEqual(result.status);
    expect(result.scan_started_at).toBeDefined();
  });

  afterAll(async () => {
    await Promise.all([
      dbClientPool.query(DELETE_SCAN_EVENT_ID, [scanEventIdInQueued]),
      dbClientPool.query(DELETE_SCAN_EVENT_ID, [scanEventIdInInProgress]),
    ]);
    disconnectDatabase();
  })
});
