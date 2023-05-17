import * as db from "../helper";
import { sessionBuilder, sessionCleaner, updateSession } from "../../managers/sessionManager";
import { SessionModel } from "../../entities/Session";
import { SessionStatus } from "../../types";

beforeAll(async () => {
    await db.connect();
});

afterEach(async () => {
    await db.clear();
});

afterAll(async () => {
    await db.close();
});

describe("sessionBuilder", () => {
    test("Should create new session from partial session", async () => {
        const session = {
            flow: "ok",
            nextStep: { flow: "ok", id: 1 },
            status: SessionStatus.AVAILABLE,
            checkpoint: { flow: "ok", id: 1 },
        };
        const newSession = await sessionBuilder(session);

        expect(newSession).toEqual(
            expect.objectContaining({
                flow: "ok",
                nextStep: { flow: "ok", id: 1 },
                status: SessionStatus.AVAILABLE,
                stacktrace: [],
                history: [],
            })
        );
        expect(newSession.id).toBeDefined();
    });
});

describe("updateSession", () => {
    test("Should update session", async () => {
        const session = {
            username: "toto",
            userNeoId: 77,
            computerName: "wiserthanme",
            flow: "ok",
            nextStep: { flow: "ok", id: 1 },
        };
        const newSession = await sessionBuilder(session);
        newSession.nextStep = { flow: "ok", id: 1 };
        await updateSession(newSession);

        const updatedSession = await SessionModel.findOne({ id: newSession.id });
        expect(updatedSession).toEqual(
            expect.objectContaining({
                status: SessionStatus.AVAILABLE,
                computerName: "wiserthanme",
                flow: "ok",
                nextStep: {
                    flow: "ok",
                    id: 1,
                },
                stacktrace: [],
                talkingToHuman: false,
                techName: "neobot",
                ticket: expect.objectContaining({
                    uid: "GL-1",
                    userAssignedTo: [],
                    userRequester: [],
                }),
                userNeoId: 77,
                username: "toto",
                history: [],
            })
        );
    });
    test("Should create new session if session doesn't exist", async () => {
        await updateSession({
            id: "624d82dbea586780d087b9e8",
            nextStep: { flow: "ok", id: 1 },
        });
        const updatedSession = await SessionModel.findOne({ id: "624d82dbea586780d087b9e8" });
        expect(updatedSession).toBeNull();
    });
});

describe("sessionCleaner", () => {
    test("Should keep only keys pass in `keepKeys` argument", async () => {
        const session = {
            flow: "ok",
            nextStep: { flow: "ok", id: 1 },
        };
        const newSession = await sessionBuilder(session);
        const cleanSession = sessionCleaner(newSession, ["username", "userNeoId", "computerName", "ticket"]);
        expect(cleanSession).toEqual({
            username: "toto",
            userNeoId: 77,
            computerName: "wiserthanme",
            ticket: expect.objectContaining({
                uid: "GL-1",
                resources: [],
                userAssignedTo: [],
                userRequester: [],
            }),
        });
    });
    test("Should keep default keys in `keepKeys` argument", async () => {
        const session = {
            flow: "ok",
            nextStep: { flow: "ok", id: 1 },
            status: 0,
        };
        const newSession = await sessionBuilder(session);
        const cleanSession = sessionCleaner(newSession);
        expect(cleanSession).toEqual({
            id: newSession.id,
            ticket: expect.objectContaining({
                uid: "GL-1",
                resources: [],
                userAssignedTo: [],
                userRequester: [],
            }),
            username: "toto",
            userNeoId: 77,
            techName: "neobot",
            computerName: "wiserthanme",
            talkingToHuman: false,
            status: 0,
        });
    });
});
