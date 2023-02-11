import superRequest from "supertest";
import { v4 as uuidv4 } from 'uuid';
import HttpStatus from "http-status-codes";
import ScanRepositoryRoute from "../../../src/routes/ScanRepositoryRoute";
import Server from "../../../src/server";
import { dbClientPool, disconnectDatabase } from "../../../src/database/DatabaseConnector";
import ScanEventQueue, { closeScanEventQueue } from "../../../src/queue/ScanEventQueue";


describe("Test Scan repository event route", () => {
  const scanEventPath = '/scan-events/trigger';
  const scanEventResultPath = '/scan-events/results';

  const repositoryName = 'code_test_repo_api';
  const DELETE_SCAN_EVENT_BY_REPOSITORY_NAME = 'DELETE FROM scan_events where repository_name = $1';

  let server = null
  beforeAll(async () => {
    const scanRepositoryRoute = new ScanRepositoryRoute();
    server = new Server();
    await server.setRoutes([scanRepositoryRoute]);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe(`POST ${scanEventPath}`, () => {

    it("Invalid input: Missing repository name", async () => {
      const result = await superRequest(server.getServer()).post(
        scanEventPath,
      );
      const resultData = await result;
      expect(resultData.statusCode).toEqual(HttpStatus.BAD_REQUEST);
      expect(resultData.text).toEqual('Please specify repositoryName in the request body.');
    });

    it("Successfully create a scan event", async () => {

      const result = await superRequest(server.getServer()).post(
        scanEventPath,
      ).send({
        repositoryName,
      });
      const resultData = await result;
      expect(resultData.statusCode).toEqual(HttpStatus.OK);
    });

    it("Test an error occurs while adding the data to the queue", async () => {
      const mockedErrorMesaage = 'Mocked Error';
      jest.spyOn(ScanEventQueue, 'addMessage').mockImplementation(() => {
        throw new Error(mockedErrorMesaage);
      });

      const result = await superRequest(server.getServer()).post(
        scanEventPath,
      ).send({
        repositoryName,
      });
      const resultData = await result;
      expect(resultData.statusCode).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });


  describe(`GET ${scanEventResultPath}`, () => {

    const scanEventInQueuedStatus = '23234-234-657-23411';
    const scanEventInSuccessStatus = '67565-3434-45345-234311';
    const DELETE_SCAN_EVENT_ID = `DELETE from scan_events where id = $1`;
    const DELETE_SCAN_EVENT_RESULT = `DELETE from scan_events_result where scan_event_id = $1`;

    const SCAN_EVENT_IN_QUEUED = `
    INSERT INTO public.scan_events
      (id, repository_name, status, status_code, queued_at, scan_started_at, scan_finished)
      VALUES('${scanEventInQueuedStatus}', '1231233', 'Queued', 0, '2023-02-09 10:09:43.875', NULL, NULL);
    `;

    const SCAN_EVENT_IN_SUCCESS = `
    INSERT INTO public.scan_events
    (id, repository_name, status, status_code, queued_at, scan_started_at, scan_finished)
    VALUES('${scanEventInSuccessStatus}', '1231233', 'Success', 0, '2023-02-09 21:51:15.399', '2023-02-09 21:51:23.691', '2023-02-09 21:51:24.305');
    `;
    const SCAN_EVENT_RESULT = `
    INSERT INTO public.scan_events_result
    (id, scan_event_id, findings, scan_result, failed_remark, created_at)
    VALUES('${uuidv4()}', '${scanEventInSuccessStatus}', '[{"type":"sast","location":{"path":"Troglodyte_Ranivorous","positions":{"begin":{"line":857}}}},{"type":"sast","location":{"path":"Crapulence_Cockamamie","positions":{"begin":{"line":65}}}},{"type":"sast","location":{"path":"Mumpsimus_Borborygm","positions":{"begin":{"line":785}}}}]'::json, true, NULL, '2023-02-09 21:51:24.305');    
    `;

    beforeAll(async () => {
      await dbClientPool.query(SCAN_EVENT_IN_SUCCESS, []);
      await Promise.all([
        dbClientPool.query(SCAN_EVENT_IN_QUEUED, []),
        dbClientPool.query(SCAN_EVENT_RESULT, []),
      ])
    });

    it("No event id is specified in the path parameter", async () => {
      const result = await superRequest(server.getServer()).get(
        scanEventResultPath,
      ).send();
      const resultData = await result;
      expect(resultData.statusCode).toEqual(HttpStatus.NOT_FOUND);
    });

    it("No data found", async () => {
      const randomScanId = 'random-scan-id';
      const result = await superRequest(server.getServer()).get(
        `${scanEventResultPath}/${randomScanId}`,
      ).send();
      const resultData = await result;
      expect(resultData.statusCode).toEqual(HttpStatus.NOT_FOUND);
      expect(resultData.text).toEqual(`Data for the event id ${randomScanId} is not found.`);
    });

    it("Get event result in Queue status (no scan event result data)", async () => {
      const result = await superRequest(server.getServer()).get(
        `${scanEventResultPath}/${scanEventInQueuedStatus}`,
      ).send();
      const resultData = await result;
      expect(resultData.statusCode).toEqual(HttpStatus.OK);
    });

    it("Get event result in In Progress status (with event result data)", async () => {
      const result = await superRequest(server.getServer()).get(
        `${scanEventResultPath}/${scanEventInSuccessStatus}`,
      ).send();
      const resultData = await result;
      expect(resultData.statusCode).toEqual(HttpStatus.OK);
    });

    it("An error occurs while getting data", async () => {
      const eventId = '123-456-768';

      // Return null to throw an error
      const mock = jest.spyOn(dbClientPool, 'query').mockImplementation(() => {
        return null;
      });
      const result = await superRequest(server.getServer()).get(
        `${scanEventResultPath}/${eventId}`,
      ).send();

      // reset the mock
      mock.mockReset();

      const resultData = await result;
      expect(resultData.statusCode).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultData.text).toEqual(`An error occur while getting result for event id ${eventId}.`);
    });

    afterAll(async () => {
      await dbClientPool.query(DELETE_SCAN_EVENT_RESULT, [scanEventInSuccessStatus]);
      await Promise.all([
        dbClientPool.query(DELETE_SCAN_EVENT_ID, [scanEventInQueuedStatus]),
        dbClientPool.query(DELETE_SCAN_EVENT_ID, [scanEventInSuccessStatus]),
      ]);
    });
  });

  afterAll(async () => {
    jest.clearAllMocks();
    await Promise.all([
      dbClientPool.query(DELETE_SCAN_EVENT_BY_REPOSITORY_NAME, [repositoryName]),
    ]);
    await Promise.all([
      disconnectDatabase(),
      closeScanEventQueue(),
    ]);
  })
});
