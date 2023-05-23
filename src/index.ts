import { app } from "./server";
import logger from "./console/logger";
import { connectToDB } from "./db/mongoDBConnection";
import https from "https";
import http from "http";
import FS from "./wrapper/fs";
import * as dotenv from "dotenv";
import { connectToNlu } from "./managers/nlu";

dotenv.config();

const { NODE_ENV, LOCAL_URL, LOCAL_PORT, SERVICE_CRT, SERVICE_KEY, NLU_SERVER_URL, NLU_SECRET, SECRET } = process.env;

(async () => {
    try {
        if (NODE_ENV !== "test") {
            if (!LOCAL_URL || !LOCAL_PORT || !NLU_SERVER_URL || !NLU_SECRET || !SERVICE_CRT || !SERVICE_KEY) {
                throw new Error("Missing environment variables");
            }
            await connectToDB("chatbot");
            await connectToNlu();

            http.createServer(
                // {
                //     rejectUnauthorized: true,
                //     cert: FS.readFileSync(`./certificates/${SERVICE_CRT}`),
                //     key: FS.readFileSync(`./certificates/${SERVICE_KEY}`),
                //     requestCert: true,
                //     passphrase: SECRET,
                // },
                app
            ).listen(LOCAL_PORT, () => logger.info(`server running on port: ${LOCAL_PORT}`));
        }
    } catch (error) {
        logger.error(`Hu ho server says : ${error}`);
    }
})();
