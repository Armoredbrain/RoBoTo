import * as db from "../helper";
import {
    sessionBuilder,
    sessionCleaner,
    updateSessionTicket,
    updateSession,
    getSessionByTicketUid,
    getAvailableSessionByNeoId,
} from "../../managers/sessionManager";
import { Session } from "../../schemas/interfaces";
import { SessionModel } from "../../entities/Session";

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
        const session: Session = {
            username: "toto",
            userNeoId: 77,
            computerName: "wiserthanme",
            ticket: { uid: "GL-1" } as Partial<Ticket>,
            flow: "ok",
            nextStep: { flow: "ok", id: 1 },
        } as Session;
        const newSession = await sessionBuilder(session);

        expect(newSession).toEqual(
            expect.objectContaining({
                username: "toto",
                userNeoId: 77,
                computerName: "wiserthanme",
                ticket: expect.objectContaining({ uid: "GL-1" }),
                flow: "ok",
                nextStep: { flow: "ok", id: 1 },
                status: SessionStatus.AVAILABLE,
                stacktrace: [],
                techName: "neobot",
                talkingToHuman: false,
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
            ticket: { uid: "GL-1" } as Partial<Ticket>,
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
            username: "toto",
            userNeoId: 77,
            computerName: "wiserthanme",
            ticket: { uid: "GL-1" } as Partial<Ticket>,
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
            username: "toto",
            userNeoId: 77,
            computerName: "wiserthanme",
            ticket: { uid: "GL-1" } as Partial<Ticket>,
            flow: "ok",
            nextStep: { flow: "ok", id: 1 },
            neoBotId: 55,
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

describe("updateSessionTicket", () => {
    test("Should update ticket in session based in `args` key", async () => {
        const ticket = { uid: "GL-1" } as Partial<Ticket>;
        const ticketUpdate = updateSessionTicket(ticket, {
            name: "Problem printer",
            content: "I have some trouble to find my printer",
            resources: [
                {
                    item: { id: 4, name: "printer1", entity: { id: 1, name: "hello", itsmCode: "GL" } },
                    type: "printer",
                    tickets: [],
                },
            ],
            userAssignedTo: [55],
            userRequester: [],
            status: Status.Assigned,
            category: "phone",
        });
        expect(ticketUpdate).toEqual(
            expect.objectContaining({
                name: "Problem printer",
                content: "<p>I have some trouble to find my printer</p>",
                resources: [
                    expect.objectContaining({
                        item: { id: 4, name: "printer1", entity: { id: 1, name: "hello", itsmCode: "GL" } },
                        type: "printer",
                        tickets: [],
                    }),
                ],
                userAssignedTo: [55],
                status: Status.Assigned,
                category: "phone",
                uid: "GL-1",
                userRequester: [],
            })
        );
    });
});

describe("getSessionByTicketUid", () => {
    test("should get session by ticket uid", async () => {
        await sessionBuilder({
            username: "toto",
            userNeoId: 77,
            computerName: "wiserthanme",
            ticket: { uid: "GHI-456-JKL" } as Partial<Ticket>,
            flow: "ok",
            nextStep: { flow: "ok", id: 1 },
        });
        const session = await getSessionByTicketUid("GHI-456-JKL");
        expect(session).toBeDefined();
    });
});

describe("getAvailableSessionByNeoId", () => {
    test("should get available and without ticket session by neo id and return it", async () => {
        await sessionBuilder({
            username: "toto",
            userNeoId: 77,
            computerName: "wiserthanme",
            ticket: { uid: "GHI-789-JKL" } as Partial<Ticket>,
            flow: "ok",
            status: 0,
            nextStep: { flow: "ok", id: 1 },
        });
        const sessionToGet = await sessionBuilder({
            username: "toto",
            userNeoId: 77,
            computerName: "wiserthanme",
            flow: "ok",
            status: 0,
            nextStep: { flow: "ok", id: 1 },
            history: [
                {
                    content:
                        "Pour information, les messages échangés dans ce chat seront enregistrés et consultables dans le ticket qui sera créé.",
                    options: [],
                    sender: 1,
                    recipients: [2],
                    isPrivate: false,
                    sequencePosition: 1,
                    createdAt: "2023-03-06T13:07:43.688Z",
                    type: MessageType.MESSAGE,
                },
            ],
        });
        const session = await getAvailableSessionByNeoId(77);
        expect(session).toBeDefined();
        expect(session!.id).toEqual(sessionToGet.id);
        expect(session!.ticket).toBeUndefined();
    });
    test("should fail to get available and without ticket session by neo id and return null", async () => {
        const session = await getAvailableSessionByNeoId(123);
        expect(session).toEqual(null);
    });
});
