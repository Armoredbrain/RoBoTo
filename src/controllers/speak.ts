import { Request, Response } from "express";
import logger from "../console/logger";
import { getSessionById, sessionBuilder, sessionCleaner, updateSession } from "../managers/sessionManager";
import { SessionStatus, Session } from "../types";
import { displayErrorTrace, tokenExtractor } from "../managers/tools";
import { stepRunner } from "../managers/stepManager";
import { fileReader } from "../managers/fileManager";

export async function speak(req: Request, res: Response): Promise<Response> {
    let session: Session | null = null;
    try {
        const { sessionId } = req.params;
        if (typeof sessionId === "string") {
            session = await getSessionById(sessionId);
        } else {
            session = await sessionBuilder({
                nextStep: { flow: "main" },
                flow: "main",
            });
        }

        // TODO: created enum for session status
        if (session.status === SessionStatus.BUSY) {
            throw new Error("Session is busy, call me back later");
        }

        session.status = SessionStatus.BUSY;
        await updateSession(session);

        session = await stepRunner(session, fileReader(session.flow), req.body.say, tokenExtractor(req));

        session.status = SessionStatus.AVAILABLE;
        await updateSession(session);

        return res.status(200).json({
            session: sessionCleaner(session),
        });
    } catch (error) {
        if (session) {
            session.status = SessionStatus.AVAILABLE;
            await updateSession(session);
        }
        logger.error("Speaking with roboto seems to be complicated at the moment");
        if (error.stack) {
            logger.error(displayErrorTrace(error));
        }

        return res.status(200).json({ session: session, error: error.message });
    }
}
