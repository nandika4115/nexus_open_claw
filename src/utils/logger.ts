import path from "path";

import winston from "winston";

export interface LoggerConfig {
  level: "debug" | "info" | "warn" | "error";
  logPath?: string;
}

export function createLogger(config: LoggerConfig): winston.Logger {
  const transports: winston.transport[] = [
    new winston.transports.Console({
      level: config.level
    })
  ];

  if (config.logPath) {
    transports.push(
      new winston.transports.File({
        filename: path.resolve(config.logPath),
        level: config.level
      })
    );
  }

  return winston.createLogger({
    level: config.level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports
  });
}
