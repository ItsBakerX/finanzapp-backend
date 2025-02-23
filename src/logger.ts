/* instanbul ignore file */

import winston from "winston";

export const logger = winston.createLogger({
    level: "debug",
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize({ all: true }),
                winston.format.timestamp(), 
                winston.format.json(),
                winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
            )
        }),
    ]
});
