import { app } from "./server";
import logger from "./console/logger";
import { connectToDB } from "./db/mongoDBConnection";
import http from "http";
import * as dotenv from "dotenv";
import { connectToNlu } from "./managers/nlu";

dotenv.config();

const { NODE_ENV, LOCAL_URL, LOCAL_PORT, NLU_SERVER_URL, NLU_SECRET } = process.env;

(async () => {
    try {
        if (NODE_ENV !== "test") {
            if (!LOCAL_URL || !LOCAL_PORT || !NLU_SERVER_URL || !NLU_SECRET) {
                throw new Error("Missing environment variables");
            }
            await connectToDB("chatbot");
            await connectToNlu();

            // TODO: implement a functionnal https server
            // https
            //     .createServer(
            //         {
            //             rejectUnauthorized: true,
            //             cert: FS.readFileSync(`./certificates/${SERVICE_CRT}`),
            //             key: FS.readFileSync(`./certificates/${SERVICE_KEY}`),
            //             requestCert: true,
            //             passphrase: SECRET,
            //         },
            //         app
            //     )
            //     .listen(LOCAL_PORT, () => logger.info(`server running on port: ${LOCAL_PORT}`));

            http.createServer(app).listen(LOCAL_PORT, () => logger.info(`server running on port: ${LOCAL_PORT}`));
        }
    } catch (error) {
        logger.error(`Hu ho server says : ${error}`);
    }
})();
