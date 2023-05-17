import { SessionModel } from "../entities/Session";
import { Session } from "../types";

export async function sessionBuilder(session: Partial<Session>): Promise<Session> {
    const userSession = new SessionModel(session);

    return (await userSession.save()).toObject();
}

export async function getSessionById(id: string): Promise<Session | undefined> {
    return (await SessionModel.findOne({ _id: id }))?.toObject() ?? undefined;
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
