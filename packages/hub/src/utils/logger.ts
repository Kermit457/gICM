/**
 * Logger utility
 */

import pino from "pino";

export class Logger {
  private logger: pino.Logger;
  private context: string;

  constructor(context: string) {
    this.context = context;
    this.logger = pino({
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "HH:MM:ss",
        },
      },
    });
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.logger.info({ context: this.context, ...data }, message);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.logger.debug({ context: this.context, ...data }, message);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.logger.warn({ context: this.context, ...data }, message);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.logger.error({ context: this.context, ...data }, message);
  }
}
