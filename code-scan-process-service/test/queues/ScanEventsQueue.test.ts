import { createClient } from "@redis/client";
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

describe("Test event subscriber", () => {
  let subscriber: ReturnType<typeof createClient>;
  it("Test create a subscriber for QUEUE_SCAN_EVENT", async () => {
    subscriber = await ScanEventQueue.createScanQueueSubscriber((message: string) => {
      console.log(message);
    });

    expect(subscriber).not.toBeNull();
  });

  afterAll(async () => {
    subscriber.quit();
  });
});
