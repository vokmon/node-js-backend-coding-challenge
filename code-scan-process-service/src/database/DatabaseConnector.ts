import logger from "../logger/WinstonLogger";
import { Pool } from "pg";
import * as path from "path";
const file = path.basename(__filename);

/**
 * Declare the client pool as a singleton object to use the same pool accross the app
 */
let _dbClientPool: Pool;

/**
 * Initial database connection
 */
export const initDatabaseConnection = async () => {
  _dbClientPool = new Pool({
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT,
    ssl: true,
  });
  logger.info(`Succesfully create a database client.`, { file });
};

/**
 * Disconnect database connection
 */
export const disconnectDatabase = () => {
  logger.info(`Succesfully close database connection`, { file });
  _dbClientPool.end();
};

/**
 * Object of database client
 */
export const dbClientPool = {
  /**
   * Perform query by query string and values
   * @param query query string. The queryting should be in prepared statement.
   * @param values values to be replaced in the query string
   * @returns 
   */
  query: async (query: string, values: any[]) => {
    try {
      return await _dbClientPool.query(query, values);
    } catch (e) {
      throw e;
    }
  },

  /**
   * Perform query by query string and values with transaction control
   * If an error occurs, the database will rollback.
   * If success, the changes will be committed.
   * 
   * @param transactionFunction 
   * @returns 
   */
  queryWithTransaction: async (transactionFunction: (client: Pool) => any) => {
    if (!_dbClientPool) {
      await initDatabaseConnection();
    }
    const client = await _dbClientPool.connect();
    try {
      await client.query("BEGIN");
      const result = await transactionFunction(client);
      await client.query("COMMIT");
      logger.info(`Database has been updated successfully`, { file });
      return result;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  },
};
