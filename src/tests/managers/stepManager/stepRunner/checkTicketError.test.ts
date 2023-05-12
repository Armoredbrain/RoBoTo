import { Step, SessionStatus, Ticket, ServiceName } from "@neomanis/neo-types";
import * as sessionManager from "../../../../managers/sessionManager";
import { stepRunner } from "../../../../managers/stepManager";
import { Session } from "../../../../schemas/interfaces";

let session: Session;
beforeEach(() => {
    session = {
        id: "abc123",
        talkingToHuman: false,
        username: "toto",
        techName: "neobot",
        userNeoId: 77,
        neoBotId: 55,
        computerName: "wiserthanme",
        resourcesType: "PRINTER",
        stacktrace: [] as Step[],
        flow: "basic",
        nextStep: { flow: "basic", id: 1 },
        status: SessionStatus.AVAILABLE,
        variables: {
            book: "printer",
        },
        history: [],
        entity: { id: 1, itsmCode: "IT1" },
        platform: ServiceName.NEO_HELPER,
    };
});

jest.spyOn(sessionManager, "updateSession").mockImplementation(async () => Promise.resolve());

describe("checkTicketError", () => {
    test("should set nextStep to fallBackCoord if no ticket", async () => {
        const updatedSession = await stepRunner(
            session,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "checkTicketError",
                        args: {},
                        follow: {
                            nextCoord: { flow: "basic", id: 1 },
                            fallbackCoord: { flow: "fallback", id: 1 },
                        },
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                    },
                ],
            },
            {
                message: "",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "fallback", id: 1 });
    });
    test("should set nextStep to fallBackCoord if ticket has no content or no name", async () => {
        const updatedSession = await stepRunner(
            { ...session, ticket: { uid: "GL1-1" } as Partial<Ticket> },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "checkTicketError",
                        args: {},
                        follow: {
                            nextCoord: { flow: "basic", id: 1 },
                            fallbackCoord: { flow: "fallback", id: 1 },
                        },
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                    },
                ],
            },
            {
                message: "",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "fallback", id: 1 });
    });
    test("should set nextStep to fallBackCoord if ticket content equals 'Ticket without content' or name equals 'Ticket without name'", async () => {
        const updatedSession = await stepRunner(
            {
                ...session,
                ticket: {
                    uid: "GL1-1",
                    content: "Ticket without content",
                    name: "Ticket without name",
                } as Partial<Ticket>,
            },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "checkTicketError",
                        args: {},
                        follow: {
                            nextCoord: { flow: "basic", id: 1 },
                            fallbackCoord: { flow: "fallback", id: 1 },
                        },
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                    },
                ],
            },
            {
                message: "",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "fallback", id: 1 });
    });
    test("should set nextStep to fallBackCoord if ticket content equals 'Ticket sans contenu' or name equals 'Ticket sans titre'", async () => {
        const updatedSession = await stepRunner(
            {
                ...session,
                ticket: {
                    uid: "GL1-1",
                    content: "Ticket sans contenu",
                    name: "Ticket sans titre",
                } as Partial<Ticket>,
            },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "checkTicketError",
                        args: {},
                        follow: {
                            nextCoord: { flow: "basic", id: 1 },
                            fallbackCoord: { flow: "fallback", id: 1 },
                        },
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                    },
                ],
            },
            {
                message: "",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "fallback", id: 1 });
    });
    test("should set nextStep to nextCoord if ticket content and name had already been set", async () => {
        const updatedSession = await stepRunner(
            {
                ...session,
                ticket: {
                    uid: "GL1-1",
                    content: "Valid content for the ticket",
                    name: "That's a real ticketName",
                } as Partial<Ticket>,
            },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "checkTicketError",
                        args: {},
                        follow: {
                            nextCoord: { flow: "basic", id: 1 },
                            fallbackCoord: { flow: "fallback", id: 1 },
                        },
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                    },
                ],
            },
            {
                message: "",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 1 });
    });
});
