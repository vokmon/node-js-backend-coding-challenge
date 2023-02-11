import winston from 'winston';

/**
 * Define log format
 */
const logFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.errors({ stack: true }),
  winston.format.json({
    space: 2,
  }),
  winston.format.timestamp(),
  winston.format.printf(msg => {
    const { error, file } = msg;
    const message = `[${msg.timestamp}] ${file ? `[${file}]` : ''} [${msg.level}] - ${msg.message} \n${msg.level.includes('error') ? msg?.stack || error?.stack : ''}`

    return message;
  }),
);

const consoleTransport = new winston.transports.Console({
  format: logFormat,
});

const transports = [
  consoleTransport,
];

export default transports;