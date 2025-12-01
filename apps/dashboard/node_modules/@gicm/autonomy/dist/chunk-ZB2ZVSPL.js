// src/utils/logger.ts
import pino from "pino";
var isDev = process.env.NODE_ENV !== "production";
var transport = isDev ? {
  target: "pino-pretty",
  options: {
    colorize: true,
    translateTime: "SYS:standard",
    ignore: "pid,hostname"
  }
} : void 0;
var baseLogger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport
});
var Logger = class {
  logger;
  constructor(context) {
    this.logger = baseLogger.child({ context });
  }
  info(message, data) {
    if (data) {
      this.logger.info(data, message);
    } else {
      this.logger.info(message);
    }
  }
  warn(message, data) {
    if (data) {
      this.logger.warn(data, message);
    } else {
      this.logger.warn(message);
    }
  }
  error(message, data) {
    if (data) {
      this.logger.error(data, message);
    } else {
      this.logger.error(message);
    }
  }
  debug(message, data) {
    if (data) {
      this.logger.debug(data, message);
    } else {
      this.logger.debug(message);
    }
  }
};

export {
  Logger
};
//# sourceMappingURL=chunk-ZB2ZVSPL.js.map