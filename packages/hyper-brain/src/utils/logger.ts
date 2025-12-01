/**
 * HYPER BRAIN Logger
 */

import pino from "pino";

const transport = pino.transport({
  target: "pino-pretty",
  options: {
    colorize: true,
    translateTime: "SYS:standard",
    ignore: "pid,hostname",
  },
});

const baseLogger = pino(transport);

export class Logger {
  private logger: pino.Logger;
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
    this.logger = baseLogger.child({ module: prefix });
  }

  info(message: string, data?: Record<string, unknown>): void {
    if (data) {
      this.logger.info(data, `[${this.prefix}] ${message}`);
    } else {
      this.logger.info(`[${this.prefix}] ${message}`);
    }
  }

  warn(message: string, data?: Record<string, unknown>): void {
    if (data) {
      this.logger.warn(data, `[${this.prefix}] ${message}`);
    } else {
      this.logger.warn(`[${this.prefix}] ${message}`);
    }
  }

  error(message: string, data?: Record<string, unknown>): void {
    if (data) {
      this.logger.error(data, `[${this.prefix}] ${message}`);
    } else {
      this.logger.error(`[${this.prefix}] ${message}`);
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (data) {
      this.logger.debug(data, `[${this.prefix}] ${message}`);
    } else {
      this.logger.debug(`[${this.prefix}] ${message}`);
    }
  }

  child(bindings: Record<string, unknown>): Logger {
    const childLogger = new Logger(this.prefix);
    childLogger.logger = this.logger.child(bindings);
    return childLogger;
  }
}

export const logger = new Logger("HyperBrain");
