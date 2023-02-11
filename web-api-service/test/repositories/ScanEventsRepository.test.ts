import dotenv from "dotenv";
dotenv.config();
import { dbClientPool, disconnectDatabase, initDatabaseConnection } from "../../src/database/DatabaseConnector";
import ScanEventsRepositoryModel from "../../src/models/repositories/ScanEventsRepositoryModel";
import ScanEventsRepository from "../../src/repositories/ScanEventsRepository";

describe("Test scan event repository", () => {
  const scanEventsRepository = new ScanEventsRepository();

  const DELETE_SCAN_EVENT_ID = `DELETE from scan_events where id = $1`;

  beforeAll(() => {
    initDatabaseConnection();
  });

  describe("Test add event to database", () => {
    let data: ScanEventsRepositoryModel = null;
    it("Test add a new scan event to the database", async () => {
      const repositoryName = "code_test_repo";
      const result = await scanEventsRepository.addScanEventToQueue(repositoryName);
      data = result;
      expect(result.id).toBeDefined()
      expect(result.queued_at).toBeDefined();
      expect(result.repository_name).toEqual(repositoryName);

      // Test the data is saved to the db
      const dataFromDb = await dbClientPool.query('Select id from scan_events where id = $1', [result.id])
      expect(result.id).toEqual(dataFromDb.rows[0].id);
    });

    afterAll(async () => {
      await dbClientPool.query(DELETE_SCAN_EVENT_ID, [data.id]);
    });
  });


  describe("Test get scan event result", () => {

    const scanEventInQueuedStatus = '23234-234-657-234'
    const SCAN_EVENT_IN_QUEUED = `
    INSERT INTO public.scan_events
      (id, repository_name, status, status_code, queued_at, scan_started_at, scan_finished)
      VALUES('${scanEventInQueuedStatus}', '1231233', 'Queued', 0, '2023-02-09 10:09:43.875', NULL, NULL);
    `

    const scanEventInSuccessStatus = '67565-3434-45345-2343'
    const SCAN_EVENT_IN_SUCCESS = `
    INSERT INTO public.scan_events
    (id, repository_name, status, status_code, queued_at, scan_started_at, scan_finished)
    VALUES('${scanEventInSuccessStatus}', '1231233', 'Success', 0, '2023-02-09 21:51:15.399', '2023-02-09 21:51:23.691', '2023-02-09 21:51:24.305');
    `
    const SCAN_EVENT_RESULT = `
    INSERT INTO public.scan_events_result
    (id, scan_event_id, findings, scan_result, failed_remark, created_at)
    VALUES('28340-29834-298347812', '${scanEventInSuccessStatus}', '[{"type":"sast","location":{"path":"Troglodyte_Ranivorous","positions":{"begin":{"line":857}}}},{"type":"sast","location":{"path":"Crapulence_Cockamamie","positions":{"begin":{"line":65}}}},{"type":"sast","location":{"path":"Mumpsimus_Borborygm","positions":{"begin":{"line":785}}}}]'::json, true, NULL, '2023-02-09 21:51:24.305');    
    `
    const DELETE_SCAN_EVENT_RESULT = `DELETE from scan_events_result where scan_event_id = $1`;

    beforeAll(async () => {
      await dbClientPool.query(SCAN_EVENT_IN_SUCCESS, []);
      await Promise.all([
        dbClientPool.query(SCAN_EVENT_IN_QUEUED, []),
        dbClientPool.query(SCAN_EVENT_RESULT, []),
      ])
    });

    it("Test get no data", async () => {
      const result = await scanEventsRepository.getScanEventByEventId("random-scan-event-id");
      expect(result.scanEvent).toBeNull();
      expect(result.scanEventResult.length).toEqual(0);
    });

    it("Test get event result in Queue status (no scan event result data)", async () => {
      const result = await scanEventsRepository.getScanEventByEventId(scanEventInQueuedStatus);
      expect(result.scanEvent).toBeDefined();
      expect(result.scanEvent.id).toEqual(scanEventInQueuedStatus);
      expect(result.scanEvent.status).toEqual('Queued');
      expect(result.scanEventResult.length).toEqual(0);
    });

    it("Test get event result in In Success status (with scan event result data)", async () => {
      const result = await scanEventsRepository.getScanEventByEventId(scanEventInSuccessStatus);
      expect(result.scanEvent).toBeDefined();
      expect(result.scanEvent.id).toEqual(scanEventInSuccessStatus);
      expect(result.scanEvent.status).toEqual('Success');
      expect(result.scanEventResult.length).toBeGreaterThan(0);

      const scanResult = result.scanEventResult[0];
      expect(scanResult.id).toBeDefined();
      expect(scanResult.scan_event_id).toEqual(scanEventInSuccessStatus);
      expect(scanResult.created_at).toBeDefined();
      expect(scanResult.failed_remark).toBeNull();
      expect(scanResult.scan_result).toBeTruthy();
      expect(scanResult.findings.length).toBeGreaterThan(0);
    });

    afterAll(async () => {
      dbClientPool.query(DELETE_SCAN_EVENT_RESULT, [scanEventInSuccessStatus]),
      await Promise.all([
        dbClientPool.query(DELETE_SCAN_EVENT_ID, [scanEventInQueuedStatus]),
        dbClientPool.query(DELETE_SCAN_EVENT_ID, [scanEventInSuccessStatus]),
      ]);
    });
  });

  afterAll(async () => {
    disconnectDatabase();
  })
})
