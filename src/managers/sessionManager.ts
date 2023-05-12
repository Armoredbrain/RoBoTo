import { SessionModel } from "../entities/Session";
import { SessionStatus, Session } from "../types";

export async function sessionBuilder(session: Partial<Session>): Promise<Session> {
    const userSession = new SessionModel(session);

    return await userSession.save();
}

export async function getSessionById(id: string): Promise<Session> {
    return await SessionModel.findOne({ _id: id }).orFail();
}

export async function getSessionByTicketUid(ticketUid: string): Promise<Session | undefined | null> {
    return await SessionModel.findOne({ "ticket.uid": ticketUid });
}

/**
 *  It will get an available session without ticket
 */
export async function getAvailableSessionByNeoId(userNeoId: number): Promise<Session | null> {
    return await SessionModel.findOne(
        {
            status: SessionStatus.AVAILABLE,
            ticket: { $exists: false },
            userNeoId: userNeoId,
            "history.0": { $exists: true },
        },
        {},
        { created_at: -1 }
    );
}

export async function updateSession(session: Partial<Session>): Promise<void> {
    await SessionModel.findByIdAndUpdate(session.id, { $set: session });
}

export function sessionCleaner(session: Session, keepKeys: string[] = ["id", "status"]): Partial<Session> {
    const reduceSession = keepKeys.reduce((acc: Partial<Session>, key: string) => {
        Object.assign(acc, { [key]: Reflect.get(session, key) });

        return acc;
    }, {});

    return reduceSession;
}
