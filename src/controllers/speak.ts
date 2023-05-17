import { Request, Response } from "express";
import logger, { BotError } from "../console/logger";
import { getSessionById, sessionBuilder, sessionCleaner } from "../managers/sessionManager";
import { Session } from "../types";
import { stepRunner } from "../managers/stepManager";
import { fileReader } from "../managers/fileManager";

// export async function createUser(
//     req: Request<
//         // params
//         Record<string, string>,
//         // res body
//         unknown, // ?
//         // req body
//         NeomanisUser,
//         // req query
//         Record<string, unknown>,
//         // res locals ?
//         { neoToken: string; credentials: ItsmCredential[] }
//     >,
//     res: Response<
//         // res body
//         { code: number; message: string },
//         // res locals
//         { neoToken: string; credentials: ItsmCredential[] }
//     >
// ): Promise<Response> {

export async function speak(req: Request, res: Response): Promise<Response> {
    let session: Session | undefined;
    try {
        if (typeof req.params.sessionId === "string") {
            session = await getSessionById(req.params.sessionId);
        }
        if (!session) {
            session = await sessionBuilder({
                nextStep: { flow: "main" },
                flow: "main",
            });
        }

        // TODO: flow should be stored in db and seeded at service startup
        session = await stepRunner(session, fileReader(session.flow), req.body.say);

        return res.status(200).json({
            session: sessionCleaner(session),
        });
    } catch (error) {
        logger.error(
            new BotError(error, {
                source: speak.name,
                customMessage: "Speaking with roboto seems to be complicated at the moment",
                code: error.code,
            })
        );

        return res.status(200).json({ session: session, error: error.message });
    }
}
