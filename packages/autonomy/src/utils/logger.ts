/**
 * Logger utility for Autonomy package
 */

import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const transport = isDev
  ? {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    }
  : undefined;

const baseLogger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport,
});

export class Logger {
  private logger: pino.Logger;

  constructor(context: string) {
    this.logger = baseLogger.child({ context });
  }

  info(message: string, data?: Record<string, unknown>): void {
    if (data) {
      this.logger.info(data, message);
    } else {
      this.logger.info(message);
    }
  }

  warn(message: string, data?: Record<string, unknown>): void {
    if (data) {
      this.logger.warn(data, message);
    } else {
      this.logger.warn(message);
    }
  }

  error(message: string, data?: Record<string, unknown>): void {
    if (data) {
      this.logger.error(data, message);
    } else {
      this.logger.error(message);
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (data) {
      this.logger.debug(data, message);
    } else {
      this.logger.debug(message);
    }
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}

export default Logger;
