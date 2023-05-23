import { Request, Response } from "express";
import logger, { BotError } from "../console/logger";
import { getSessionById, sessionBuilder, sessionCleaner, updateSession } from "../managers/sessionManager";
import { Session, SessionStatus } from "../types";
import { stepRunner } from "../managers/stepManager";
import { FLOWS, fileReader } from "../managers/fileManager";
import { Say } from "../types";

export async function speak(
    req: Request<Record<string, string>, unknown, { say: Say }, Record<string, unknown>, Record<string, unknown>>,
    res: Response<
        { session: Partial<Session>; say: Say } | { session: Partial<Session> | undefined; error: string },
        Record<string, unknown>
    >
): Promise<Response> {
    let session: Session | undefined;
    try {
        session = await getSessionById(req.params.sessionId);
        if (!session) {
            session = await sessionBuilder({
                nextStep: { flow: "main", stepId: 1 },
                flow: "main",
                status: SessionStatus.BUSY,
            });
        } else if (session.status === SessionStatus.BUSY || session.status === SessionStatus.CLOSED) {
            throw new Error("Session is unavailable");
        }

        await updateSession({ id: session.id, status: SessionStatus.BUSY });

        // TODO: flow should be stored in db and seeded at service startup
        const sessionAndSay = await stepRunner(session, fileReader(FLOWS(), session.flow), req.body.say);

        await updateSession({ id: session.id, status: SessionStatus.AVAILABLE });

        return res.status(200).json({
            session: sessionCleaner(sessionAndSay.session),
            say: sessionAndSay.say,
        });
    } catch (error) {
        logger.error(
            new BotError(error, {
                source: speak.name,
                customMessage: "Speaking with roboto seems to be complicated at the moment",
                code: error.code,
            })
        );

        return res
            .status(500)
            .json(
                session
                    ? { session: sessionCleaner(session), error: error.message }
                    : { session: undefined, error: error.message }
            );
    }
}
