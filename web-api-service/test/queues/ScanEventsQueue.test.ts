import dotenv from "dotenv";
dotenv.config();
import ScanEventQueue, { closeScanEventQueue, initScanEventQueue } from "../../src/queue/ScanEventQueue";

describe("Test add event to queue", () => {
  beforeAll(() => {
    initScanEventQueue();
  });

  it("Test add a new scan event to the queue", async () => {
    const scanId = 'uie94-3438-234';
    ScanEventQueue.addMessage(scanId)
  });

  afterAll(async () => {
    await closeScanEventQueue()
  })
});
