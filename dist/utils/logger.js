import path from "path";
import winston from "winston";
export function createLogger(config) {
    const transports = [
        new winston.transports.Console({
            level: config.level
        })
    ];
    if (config.logPath) {
        transports.push(new winston.transports.File({
            filename: path.resolve(config.logPath),
            level: config.level
        }));
    }
    return winston.createLogger({
        level: config.level,
        format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
        transports
    });
}
