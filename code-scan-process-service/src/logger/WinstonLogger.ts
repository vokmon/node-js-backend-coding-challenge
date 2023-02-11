import winston from 'winston';
import winstonTransports from './WinstonTransports';

/**
 * Logger instance for logging information in the application
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  handleExceptions: true,
  transports: [
    ...winstonTransports,
  ],
});

export default logger;