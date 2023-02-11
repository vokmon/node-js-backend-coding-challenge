import superRequest from "supertest";
import { disconnectDatabase } from "../../../src/database/DatabaseConnector";
import { closeScanEventQueue } from "../../../src/queue/ScanEventQueue";
import IndexRoute from "../../../src/routes/IndexRoute";
import Server from "../../../src/server";


describe("Testing", () => {
  describe("GET /", () => {
    it("Server can start", async () => {
      const indexRoute = new IndexRoute();
      const server = new Server();
      await server.setRoutes([indexRoute]);

      const result = await superRequest(server.getServer()).get(
        `${indexRoute.path}`,
      );
      const resultData = await result;
      expect(resultData.statusCode).toEqual(200);
    });
  });

  afterAll(async () => {
    await Promise.all([
      disconnectDatabase(),
      closeScanEventQueue(),
    ]);
  })
});
