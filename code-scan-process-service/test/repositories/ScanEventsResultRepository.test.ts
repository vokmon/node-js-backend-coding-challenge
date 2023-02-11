import dotenv from "dotenv";
dotenv.config();
import { v4 as uuidv4 } from 'uuid';
import { dbClientPool, disconnectDatabase, initDatabaseConnection } from "../../src/database/DatabaseConnector";
import { ScanEventRepositoryModel, ScanEventStatus } from "../../src/models/repositories/ScanEventRepositoryModel";
import { Finding } from "../../src/models/repositories/ScanEventResultRepositoryModel";
import { ScanEventResultRepositoryModel } from "../../src/models/repositories/ScanEventResultRepositoryModel";
import { ScanRepositoryResult } from "../../src/models/services/ScanRepositoryResult";
import ScanEventsResultRepository from "../../src/repositories/ScanEventsResultRepository";
import Utils from "../../src/utils/Utils";

describe("Test update scan event to In Progress", () => {
  const INSERT_QUEDED_EVENT = `INSERT INTO scan_events 
  (id, repository_name, status, queued_at) 
  VALUES($1, $2, $3, $4);
  `
  const GET_SCAN_EVENT = `SELECT * from scan_events where id = $1`;
  const GET_SCAN_EVENT_RESULT = `SELECT * from scan_events_result where scan_event_id = $1`;
  const DELETE_SCAN_EVENT_RESULT_BY_EVENT_ID = `DELETE from scan_events_result where scan_event_id = $1`;
  const DELETE_SCAN_EVENT_ID = `DELETE from scan_events where id = $1`;

  let scanEventsResultRepository: ScanEventsResultRepository;
  const scanEventIdInQueued1 = '7649-348-2348';
  const scanEventIdInQueued2 = '3438-234-234234';
  const scanEventIdInQueued3 = '9387-786-83483';

  beforeAll(async () => {
    initDatabaseConnection();
    const currentDate = new Date();
    await Promise.all([
      dbClientPool.query(INSERT_QUEDED_EVENT, [scanEventIdInQueued1, 'code-scan-process-repo', ScanEventStatus.Queued, currentDate]),
      dbClientPool.query(INSERT_QUEDED_EVENT, [scanEventIdInQueued2, 'code-scan-process-repo', ScanEventStatus.Queued, currentDate]),
      dbClientPool.query(INSERT_QUEDED_EVENT, [scanEventIdInQueued3, 'code-scan-process-repo', ScanEventStatus.Queued, currentDate]),
    ])
    scanEventsResultRepository = new ScanEventsResultRepository();
  });

  const mockFindings = (): ScanRepositoryResult => {
    const result: Finding[] = [];
    const vulnerabilities = 3;
    for (let i = 0; i < vulnerabilities; i++) {
      const randomLineOfCode = Utils.getRandomInt(1000);
      const path = uuidv4();

      // Compose the finding objects
      const finding = {
        type: 'sast',
        location: {
          path,
          positions: {
            begin: {
              line: randomLineOfCode,
            }
          }
        }
      }

      result.push(finding);
    }
    return { vulnerabilityScore: vulnerabilities, findings: result }
  }
  it("Successfully update the scan event result and scan event to Success", async () => {
    let scanEventData = await dbClientPool.query(GET_SCAN_EVENT, [scanEventIdInQueued1]);
    let scanEventDataFromDb: ScanEventRepositoryModel = scanEventData.rows[0];

    const scanEventDataToUpdate: ScanEventRepositoryModel = {
      ...scanEventDataFromDb,
    };
    scanEventDataToUpdate.status = ScanEventStatus.Success;
    const mockedScanResult = mockFindings();
    await scanEventsResultRepository.saveScanEventsResult(scanEventDataToUpdate, mockedScanResult);


    // Validate data from Database
    scanEventData = await dbClientPool.query(GET_SCAN_EVENT, [scanEventIdInQueued1]);
    scanEventDataFromDb = scanEventData.rows[0];
    expect(scanEventDataFromDb.id).toEqual(scanEventIdInQueued1);
    expect(scanEventDataFromDb.status).toEqual(ScanEventStatus.Success.valueOf());
    expect(scanEventDataFromDb.scan_started_at).toBeDefined();
    expect(scanEventDataFromDb.scan_finished).toBeDefined();

    const scanEventResultData = await dbClientPool.query(GET_SCAN_EVENT_RESULT, [scanEventIdInQueued1]);
    const scanEventResultDataFromDb: ScanEventResultRepositoryModel = scanEventResultData.rows[0];
    expect(scanEventResultDataFromDb.id).toBeDefined();
    expect(scanEventResultDataFromDb.scan_event_id).toEqual(scanEventIdInQueued1);
    expect(scanEventResultDataFromDb.findings).toMatchObject(mockedScanResult.findings);
    expect(scanEventResultDataFromDb.scan_result).toBeTruthy();
    expect(scanEventResultDataFromDb.created_at).toBeDefined();
  });

  it("Successfully update the scan event result and scan event to Failure", async () => {
    let scanEventData = await dbClientPool.query(GET_SCAN_EVENT, [scanEventIdInQueued2]);
    let scanEventDataFromDb: ScanEventRepositoryModel = scanEventData.rows[0];

    const scanEventDataToUpdate: ScanEventRepositoryModel = {
      ...scanEventDataFromDb,
    };
    scanEventDataToUpdate.status = ScanEventStatus.Failure;
    const mockedScanResult = mockFindings();
    await scanEventsResultRepository.saveScanEventsResult(scanEventDataToUpdate, mockedScanResult);


    // Validate data from Database
    scanEventData = await dbClientPool.query(GET_SCAN_EVENT, [scanEventIdInQueued2]);
    scanEventDataFromDb = scanEventData.rows[0];
    expect(scanEventDataFromDb.id).toEqual(scanEventIdInQueued2);
    expect(scanEventDataFromDb.status).toEqual(ScanEventStatus.Failure.valueOf());
    expect(scanEventDataFromDb.scan_started_at).toBeDefined();
    expect(scanEventDataFromDb.scan_finished).toBeDefined();

    const scanEventResultData = await dbClientPool.query(GET_SCAN_EVENT_RESULT, [scanEventIdInQueued2]);
    const scanEventResultDataFromDb: ScanEventResultRepositoryModel = scanEventResultData.rows[0];
    expect(scanEventResultDataFromDb.id).toBeDefined();
    expect(scanEventResultDataFromDb.scan_event_id).toEqual(scanEventIdInQueued2);
    expect(scanEventResultDataFromDb.findings).toMatchObject(mockedScanResult.findings);
    expect(scanEventResultDataFromDb.scan_result).toBeTruthy();
    expect(scanEventResultDataFromDb.created_at).toBeDefined();
  });

  it("Test saveScanEventFailedToScan to store error message when the scan cannot be completed", async () => {
    let scanEventData = await dbClientPool.query(GET_SCAN_EVENT, [scanEventIdInQueued3]);
    let scanEventDataFromDb: ScanEventRepositoryModel = scanEventData.rows[0];
    const scanEventDataToUpdate: ScanEventRepositoryModel = {
      ...scanEventDataFromDb,
    };
    const mockedScanResult = mockFindings();
    const errorMessage = "An error occurs while scaning the repository";
    await scanEventsResultRepository.saveScanEventFailedToScan(scanEventDataToUpdate, mockedScanResult, errorMessage);

    // Validate data from Database
    const newScanEventData = await dbClientPool.query(GET_SCAN_EVENT, [scanEventIdInQueued3]);
    const newScanEventDataFromDb = newScanEventData.rows[0];
    expect(newScanEventDataFromDb.id).toEqual(scanEventIdInQueued3);
    expect(newScanEventDataFromDb.status).toEqual(scanEventDataFromDb.status);
    expect(newScanEventDataFromDb.scan_started_at).toBeDefined();
    expect(newScanEventDataFromDb.scan_finished).toBeNull();

    const scanEventResultData = await dbClientPool.query(GET_SCAN_EVENT_RESULT, [scanEventIdInQueued3]);
    const scanEventResultDataFromDb: ScanEventResultRepositoryModel = scanEventResultData.rows[0];
    expect(scanEventResultDataFromDb.id).toBeDefined();
    expect(scanEventResultDataFromDb.scan_event_id).toEqual(scanEventIdInQueued3);
    expect(scanEventResultDataFromDb.scan_result).toBeFalsy();
    expect(scanEventResultDataFromDb.failed_remark).toEqual(errorMessage)
    expect(scanEventResultDataFromDb.created_at).toBeDefined();

  });

  afterAll(async () => {
    await Promise.all([
      dbClientPool.query(DELETE_SCAN_EVENT_RESULT_BY_EVENT_ID, [scanEventIdInQueued1]),
      dbClientPool.query(DELETE_SCAN_EVENT_RESULT_BY_EVENT_ID, [scanEventIdInQueued2]),
      dbClientPool.query(DELETE_SCAN_EVENT_RESULT_BY_EVENT_ID, [scanEventIdInQueued3]),

    ]);
    await Promise.all([
      dbClientPool.query(DELETE_SCAN_EVENT_ID, [scanEventIdInQueued1]),
      dbClientPool.query(DELETE_SCAN_EVENT_ID, [scanEventIdInQueued2]),
      dbClientPool.query(DELETE_SCAN_EVENT_ID, [scanEventIdInQueued3]),
    ]);
    disconnectDatabase();
  });
});
