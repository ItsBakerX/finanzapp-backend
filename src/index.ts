/* istanbul ignore file */
import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import https from 'https';
import mongoose from 'mongoose';
import app from './jestApp';
import { logger } from './logger';
import { readFile } from 'fs/promises';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { prefillDB } from './prefill';

async function setup() {

    let mongoURI = process.env.DB_CONNECTION_STRING;
    if (!mongoURI) {
        console.error("No database connection string found in .env file");
        process.exit(1);
    }

    if (mongoURI === "memory") {
        logger.info("Using in-memory database");
        const mongod = await MongoMemoryServer.create();
        mongoURI = mongod.getUri();
    } else {
        logger.info(`Using MongoDB Atlas with URI: ${mongoURI}`);
    }

    logger.info(`Connecting to database at ${mongoURI}`);
    try {
        await mongoose.connect(mongoURI);
        logger.info("Successfully connected to the database");
    } catch (error) {
        logger.error("Error connecting to the database", error);
        process.exit(1);
    }

    // await prefillDB();

    const useSSL = process.env.USE_SLL;
    if (useSSL) {
        const [key, cert] = await Promise.all([
            readFile(process.env.SSL_KEY_FILE!),
            readFile(process.env.SSL_CERT_FILE!)]);
        const httpsPort: number = process.env.HTTPS_PORT ? parseInt(process.env.HTTPS_PORT) : 443;
        logger.info(`Starting HTTPS server on port ${httpsPort}`);
        const httpsServer = https.createServer({ key, cert }, app);
        httpsServer.listen(httpsPort, () => {
            logger.info(`Server listening on port ${httpsPort}`);
        });
    } else {
        const port = process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT) : 80;
        const httpServer = http.createServer(app);
        httpServer.listen(port, () => {
            logger.info(`Server listening on port ${port}`);
        });
    }
}
setup();