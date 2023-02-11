import { createClient } from "@redis/client";
import { RedisClientType } from "redis";
import * as path from "path";
import logger from '../logger/WinstonLogger';
const file = path.basename(__filename);

/**
 * Declare the queue publisher as a singleton object to use in the application
 */
let publisher: RedisClientType

/**
 * Initialize redis publisher object
 */
export const initScanEventQueue = async () => {
  publisher = createClient({
    url: process.env.REDIS_URL,
  });
  await publisher.connect();
  logger.info(`Succesfully initial Redis publisher`, { file });
}

/**
 * Close redis connection
 */
export const closeScanEventQueue = async () => {
  const result = await publisher.quit();
  logger.info(`Succesfully close Redis publisher connection: ${result}`, { file });
  return result;
}

/**
 * Scan event queue helper object
 */
const ScanEventQueue = {
  /**
   * Add message to the queue
   * @param scanEventId scan event id
   */
  addMessage: async (scanEventId: string) => {
    await publisher.publish('QUEUE_SCAN_EVENT', scanEventId);
  }
}

export default ScanEventQueue;