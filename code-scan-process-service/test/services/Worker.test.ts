import { ScanEventResultRepositoryModel } from "../../src/models/repositories/ScanEventResultRepositoryModel";
import dotenv from "dotenv";
import Worker from "../../src/services/Worker";
import { dbClientPool, disconnectDatabase, initDatabaseConnection } from "../../src/database/DatabaseConnector";
import { ScanEventRepositoryModel, ScanEventStatus } from "../../src/models/repositories/ScanEventRepositoryModel";
dotenv.config();

describe("Test worker processing", () => {
  let worker: Worker;

  const INSERT_QUEDED_EVENT = `INSERT INTO scan_events 
  (id, repository_name, status, queued_at) 
  VALUES($1, $2, $3, $4);
  `

  const INSERT_INPROGRESS_EVENT = `INSERT INTO scan_events 
  (id, repository_name, status, queued_at, scan_started_at) 
  VALUES($1, $2, $3, $4, $5);
  `

  const DELETE_SCAN_EVENT_RESULT_BY_EVENT_ID = `DELETE from scan_events_result where scan_event_id = $1`;
  const DELETE_SCAN_EVENT_ID = `DELETE from scan_events where id = $1`;

  const GET_SCAN_EVENT = `SELECT * from scan_events where id = $1`;
  const GET_SCAN_EVENT_RESULT = `SELECT * from scan_events_result where scan_event_id = $1`;

  const scanEventInQueue = '3472-3847-93847';
  const scanEventInProgress = '7363-2834-2983';
  const scanEventInQueueForError = '3439-3847-93847';

  beforeAll(async () => {
    initDatabaseConnection();
    const currentDate = new Date();
    await Promise.all([
      dbClientPool.query(INSERT_QUEDED_EVENT, [scanEventInQueue, 'code-scan-process-repo', ScanEventStatus.Queued, currentDate]),
      dbClientPool.query(INSERT_QUEDED_EVENT, [scanEventInQueueForError, 'code-scan-process-repo', ScanEventStatus.Queued, currentDate]),
      dbClientPool.query(INSERT_INPROGRESS_EVENT, [scanEventInProgress, 'code-scan-process-repo', ScanEventStatus.InProgress, currentDate, currentDate]),
    ])

    worker = new Worker();
  });

  it("Test input invalid. scan event id is null", async () => {
    let result = await worker.processScanEvent(null);
    expect(result.isSuccess).toBeFalsy();
    expect(result.errorMessage).toContain('No scan event id');

    result = await worker.processScanEvent(undefined);
    expect(result.isSuccess).toBeFalsy();
    expect(result.errorMessage).toContain('No scan event id');
  });

  it("Test input invalid. scan event id is not found", async () => {
    const result = await worker.processScanEvent("random-event-id");
    expect(result.isSuccess).toBeFalsy();
    expect(result.errorMessage).toContain('Scan event data for random-event-id is not found.');
  });

  it("Test input invalid. scan event id is In Progress status", async () => {
    const result = await worker.processScanEvent(scanEventInProgress);
    const expectedError = `Scan event id ${scanEventInProgress} is in Queued status.`
    expect(result.isSuccess).toBeFalsy();
    expect(result.errorMessage).toContain(expectedError);
  });

  it("Test successfully process the event id", async () => {
    const result = await worker.processScanEvent(scanEventInQueue);
    expect(result.isSuccess).toBeTruthy();

    // Validate data from Database
    const scanEventData = await dbClientPool.query(GET_SCAN_EVENT, [scanEventInQueue]);
    const scanEventDataFromDb: ScanEventRepositoryModel = scanEventData.rows[0];
    expect(scanEventDataFromDb.id).toEqual(scanEventInQueue);
    expect([ScanEventStatus.Success.valueOf(), ScanEventStatus.Failure.valueOf()]).toContain(scanEventDataFromDb.status)
    expect(scanEventDataFromDb.scan_started_at).toBeDefined();
    expect(scanEventDataFromDb.scan_finished).toBeDefined();

    const scanEventResultData = await dbClientPool.query(GET_SCAN_EVENT_RESULT, [scanEventInQueue]);
    const scanEventResultDataFromDb: ScanEventResultRepositoryModel = scanEventResultData.rows[0];
    expect(scanEventResultDataFromDb.id).toBeDefined();
    expect(scanEventResultDataFromDb.scan_event_id).toEqual(scanEventInQueue);
    expect(scanEventResultDataFromDb.findings).toBeDefined();
    expect(scanEventResultDataFromDb.scan_result).toBeTruthy();
    expect(scanEventResultDataFromDb.created_at).toBeDefined();
  });

  it("Test an error occurs while scaning the repository", async () => {
    const scanEventData = await dbClientPool.query(GET_SCAN_EVENT, [scanEventInQueueForError]);
    const scanEventDataFromDb: ScanEventRepositoryModel = scanEventData.rows[0];

    const mockedErrorMesaage = 'Mocked Error';
    jest.spyOn(dbClientPool, 'queryWithTransaction').mockImplementation(() => {
      throw new Error(mockedErrorMesaage);
    });

    const result = await worker.processScanEvent(scanEventInQueue);
    expect(result.isSuccess).toBeFalsy();
    expect(result.errorMessage).toEqual(mockedErrorMesaage);

    // Validate data from Database
    const newScanEventData = await dbClientPool.query(GET_SCAN_EVENT, [scanEventInQueueForError]);
    const newScanEventDataFromDb = newScanEventData.rows[0];
    expect(newScanEventDataFromDb.id).toEqual(scanEventInQueueForError);
    expect(newScanEventDataFromDb.status).toEqual(scanEventDataFromDb.status);
    expect(newScanEventDataFromDb.scan_started_at).toBeDefined();
    expect(newScanEventDataFromDb.scan_finished).toBeNull();
  });

  afterAll(async () => {
    await Promise.all([
      dbClientPool.query(DELETE_SCAN_EVENT_RESULT_BY_EVENT_ID, [scanEventInQueue]),
      dbClientPool.query(DELETE_SCAN_EVENT_RESULT_BY_EVENT_ID, [scanEventInQueueForError]),
      dbClientPool.query(DELETE_SCAN_EVENT_RESULT_BY_EVENT_ID, [scanEventInProgress]),
    ]);
    await Promise.all([
      dbClientPool.query(DELETE_SCAN_EVENT_ID, [scanEventInQueue]),
      dbClientPool.query(DELETE_SCAN_EVENT_ID, [scanEventInQueueForError]),
      dbClientPool.query(DELETE_SCAN_EVENT_ID, [scanEventInProgress]),
    ]);
    disconnectDatabase();
  })
});
