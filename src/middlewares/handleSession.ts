import { NextFunction, Request, Response } from "express";
import { SessionStatus } from "../types";
import { getSessionById, updateSession } from "../managers/sessionManager";
import logger, { BotError } from "../console/logger";

export async function checkSessionStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
        const session = await getSessionById(req.params.sessionId);
        if (session?.status === SessionStatus.BUSY || session?.status === SessionStatus.CLOSED) {
            throw new Error("Session is unavailable");
        } else if (session) {
            await updateSession({ id: session.id, status: SessionStatus.BUSY });
        }
        next();
    } catch (error) {
        const botError = new BotError(error, { source: checkSessionStatus.name, code: 403 });
        logger.error(botError);

        return res.status(botError.code).json({ code: botError.code, message: error.message });
    }
}

// TODO: trial and error with this middlware happening after controller run
export async function restoreSessionStatus(req: Request, res: Response, next: NextFunction) {
    const session = await getSessionById(req.params.sessionId);
    if (session?.status !== SessionStatus.AVAILABLE) {
        await updateSession({ id: req.params.sessionId, status: SessionStatus.AVAILABLE });
    }
    next();
}
