import mongoose from "mongoose";
import logger from "../console/logger";
import * as dotenv from "dotenv";

dotenv.config();

export async function connectToDB(database: string): Promise<typeof mongoose | undefined> {
    try {
        const port = process.env.DB_PORT ? process.env.DB_PORT : "27017";
        const host = process.env.DB_HOST ? process.env.DB_HOST : "127.0.0.1";
        const username = process.env.DB_USERNAME;
        const password = process.env.DB_PASSWORD;
        let credentials: string | undefined;
        if (username && password) {
            credentials = `${username}:${password}@`;
        }
        const connectionUrl = credentials
            ? `mongodb://${credentials}${host}:${port}/${database}?authSource=admin`
            : `mongodb://${host}:${port}/${database}`;
        const connection = await mongoose.connect(connectionUrl);
        logger.info(`connected to ${connection.connection.name} database`);

        return connection;
    } catch (error) {
        logger.error("Error during database connection");
    }
}
