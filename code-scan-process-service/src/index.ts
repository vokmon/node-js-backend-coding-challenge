import dotenv from "dotenv";
import { initDatabaseConnection } from "./database/DatabaseConnector";
dotenv.config();

import ScanEventQueue, { initScanEventQueue } from "./queue/ScanEventQueue";
import Worker from "./services/Worker";
import * as path from "path";
import logger from "./logger/WinstonLogger";
import Utils from "./utils/Utils";
const file = path.basename(__filename);

/**
 * Start the server and subscribe to the message queue
 */
const initial = async () => {
  logger.info("Initializing repository scan listener.", { file })
  await Promise.all([
    initDatabaseConnection(),
    initScanEventQueue()
  ]);
  const subscriber = ScanEventQueue.createScanQueueSubscriber(async (message: string) => {
    // Sleep X (1 - 10) seconds after pick up an scan event
    const randomSecondInt = Utils.getRandomInt(10);
    logger.info(`Receive scan even id: ${message}, sleep ${randomSecondInt} seconds before processing.`, { file })
    await Utils.delay(randomSecondInt * 1000);

    const worker = new Worker();
    worker.processScanEvent(message);
  });
  logger.info("Successfully start the listener. Waiting for incoming messages...", { file })
}

initial();
