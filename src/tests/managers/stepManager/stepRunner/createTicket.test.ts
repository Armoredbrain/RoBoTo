import * as sessionManager from "../../../../managers/sessionManager";
import * as messageManager from "../../../../managers/messageManager";
import { stepRunner } from "../../../../managers/stepManager";
import { mockAxios } from "../../../helper";
import { Step, SessionStatus, Status, Type, Ticket, MessageType, ServiceName } from "@neomanis/neo-types";
import { AxiosError } from "axios";

jest.mock("axios");

let session = {
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
describe("createTicket", () => {
    test("should set nextStep with follow step coord if a ticket already exists in session", async () => {
        const updatedSession = await stepRunner(
            {
                ...session,
                ticket: { uid: "GL1-123", content: "Default content" } as Partial<Ticket>,
            },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "createTicket",
                        args: {},
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                        follow: {
                            nextCoord: { id: 2, flow: "basic" },
                            fallbackCoord: { id: 1, flow: "basic" },
                        },
                    },
                    {
                        id: 2,
                        args: {},
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                        follow: {
                            nextCoord: { id: 1, flow: "basic" },
                            fallbackCoord: { id: 1, flow: "basic" },
                        },
                    },
                ],
            },
            {
                message: "Hello roboto",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 2 });
    });
    test("should create ticket", async () => {
        mockAxios
            .mockResolvedValueOnce(
                Promise.resolve({ data: { membership: { entities: [{ id: 1, name: "entity1", itsmCode: "GL1" }] } } })
            )
            .mockResolvedValueOnce(Promise.resolve({ data: { uid: "GL1-123" } }))
            .mockResolvedValueOnce(Promise.resolve({}));
        const updatedSession = await stepRunner(
            { ...session, history: [{ content: "hello", sender: 77, recipients: [], type: MessageType.MESSAGE }] },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "createTicket",
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                        follow: {
                            nextCoord: { id: 2, flow: "basic" },
                            fallbackCoord: { id: 1, flow: "basic" },
                        },
                    },
                ],
            },
            {
                message: "I want a ticket",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 2 });
        expect(updatedSession.ticket).toEqual({
            uid: "GL1-123",
            name: "Ticket sans titre",
            content: "<p>Ticket sans contenu</p>",
            status: Status.Assigned,
            userRequester: [77],
            userAssignedTo: [55],
            userWatcher: [],
            computerName: "wiserthanme",
            type: Type.Incident,
            entity: { id: 1, name: "entity1", itsmCode: "GL1" },
            resources: [],
        });
    });
    test("should not create ticket if get user entity calls fail and add CallError to stacktrace", async () => {
        mockAxios.mockRejectedValueOnce({
            isAxiosError: true,
            response: { statusText: "axios failed" },
        } as AxiosError);
        const updatedSession = await stepRunner(
            session,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "createTicket",
                        args: {},
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                        follow: {
                            nextCoord: { id: 2, flow: "basic" },
                            fallbackCoord: { id: 1, flow: "basic" },
                        },
                    },
                ],
            },
            {
                message: "I want a ticket",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 1 });
        expect(updatedSession.stacktrace).toEqual([
            {
                data: {
                    userNeoId: 77,
                },
                message: "axios failed",
                source: "getUserEntity",
            },
            {
                action: "createTicket",
                args: {},
                checkpoint: false,
                flow: "basic",
                follow: {
                    fallbackCoord: {
                        flow: "basic",
                        id: 1,
                    },
                    nextCoord: {
                        flow: "basic",
                        id: 2,
                    },
                },
                id: 1,
                waitForUserInput: true,
            },
        ]);
    });
    test("should not create ticket if create ticket fail and add CallError to stacktrace", async () => {
        mockAxios
            .mockResolvedValueOnce(
                Promise.resolve({ data: { membership: { entities: [{ id: 1, name: "entity1", itsmCode: "GL1" }] } } })
            )
            .mockRejectedValueOnce({
                isAxiosError: true,
                response: { statusText: "axios failed" },
            } as AxiosError);
        const updatedSession = await stepRunner(
            session,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "createTicket",
                        args: {},
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                        follow: {
                            nextCoord: { id: 2, flow: "basic" },
                            fallbackCoord: { id: 1, flow: "basic" },
                        },
                    },
                ],
            },
            {
                message: "I want a ticket",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 1 });
        expect(updatedSession.stacktrace).toEqual([
            {
                data: {
                    computerName: "wiserthanme",
                    content: "<p>Ticket sans contenu</p>",
                    entity: {
                        id: 1,
                        itsmCode: "GL1",
                        name: "entity1",
                    },
                    name: "Ticket sans titre",
                    resources: [],
                    status: Status.Assigned,
                    type: 1,
                    userAssignedTo: [55],
                    userRequester: [77],
                    userWatcher: [],
                },
                message: "axios failed",
                source: "createTicket",
            },
            {
                action: "createTicket",
                args: {},
                checkpoint: false,
                flow: "basic",
                follow: {
                    fallbackCoord: {
                        flow: "basic",
                        id: 1,
                    },
                    nextCoord: {
                        flow: "basic",
                        id: 2,
                    },
                },
                id: 1,
                waitForUserInput: true,
            },
        ]);
    });
    test("Should create ticket but send a specific message if saveChatHistory partially fail", async () => {
        mockAxios
            .mockResolvedValueOnce(
                Promise.resolve({ data: { membership: { entities: [{ id: 1, name: "entity1", itsmCode: "GL1" }] } } })
            )
            .mockResolvedValueOnce(Promise.resolve({ data: { uid: "GL1-123" } }))
            .mockResolvedValueOnce(Promise.resolve({ status: 207 }));
        const spyMessageHandler = jest
            .spyOn(messageManager, "saveMessageHandler")
            .mockResolvedValueOnce(Promise.resolve());
        const updatedSession = await stepRunner(
            session,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "createTicket",
                        args: {
                            name: "Ticket name define in args",
                            type: Type.Request,
                            defaultMessage: "Default message in case of status 207",
                        },
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                        follow: {
                            nextCoord: { id: 2, flow: "basic" },
                            fallbackCoord: { id: 1, flow: "basic" },
                        },
                    },
                ],
            },
            {
                message: "I want a ticket",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(spyMessageHandler).toHaveBeenCalled();
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 2 });
        expect(updatedSession.ticket).toEqual({
            uid: "GL1-123",
            name: "Ticket name define in args",
            content: "<p>Ticket sans contenu</p>",
            status: Status.Assigned,
            userRequester: [77],
            userAssignedTo: [55],
            userWatcher: [],
            computerName: "wiserthanme",
            type: Type.Request,
            entity: { id: 1, name: "entity1", itsmCode: "GL1" },
            resources: [],
        });
        const lastStep = updatedSession.stacktrace.at(-1) as Step;
        expect(lastStep.say?.message).toEqual("Default message in case of status 207");
    });
    test("Should create ticket but redirect user to fallback step if itsm service is down", async () => {
        mockAxios
            .mockResolvedValueOnce(
                Promise.resolve({ data: { membership: { entities: [{ id: 1, name: "entity1", itsmCode: "GL1" }] } } })
            )
            .mockResolvedValueOnce(Promise.resolve({ data: { uid: "GL1-123" } }))
            .mockRejectedValueOnce({ code: "ECONNREFUSED", message: "ECONNREFUSED" });

        const updatedSession = await stepRunner(
            session,

            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "createTicket",
                        args: {
                            defaultMessage: "Default message in case of status 207",
                        },
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                        follow: {
                            nextCoord: { id: 2, flow: "basic" },
                            fallbackCoord: { id: 1, flow: "basic" },
                        },
                    },
                ],
            },
            {
                message: "I want a ticket",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 1 });
        expect(updatedSession.ticket).toEqual({
            uid: "GL1-123",
            name: "Ticket sans titre",
            content: "<p>Ticket sans contenu</p>",
            status: Status.Assigned,
            userRequester: [77],
            userAssignedTo: [55],
            userWatcher: [],
            computerName: "wiserthanme",
            type: Type.Incident,
            entity: { id: 1, name: "entity1", itsmCode: "GL1" },
            resources: [],
        });
        expect(updatedSession.stacktrace.at(-2)).toEqual({
            data: { messages: [], ticketUid: "GL1-123" },
            message: "ECONNREFUSED",
            source: "saveChatHistory",
        });
    });
    test("Should create ticket but redirect user to fallback step if itsm returns an axios error", async () => {
        mockAxios
            .mockResolvedValueOnce(
                Promise.resolve({ data: { membership: { entities: [{ id: 1, name: "entity1", itsmCode: "GL1" }] } } })
            )
            .mockResolvedValueOnce(Promise.resolve({ data: { uid: "GL1-123" } }))
            .mockRejectedValueOnce({
                isAxiosError: true,
                response: { statusText: "axios failed" },
            } as AxiosError);

        const updatedSession = await stepRunner(
            session,

            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "createTicket",
                        args: {
                            defaultMessage: "Default message in case of status 207",
                        },
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                        follow: {
                            nextCoord: { id: 2, flow: "basic" },
                            fallbackCoord: { id: 1, flow: "basic" },
                        },
                    },
                ],
            },
            {
                message: "I want a ticket",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 1 });
        expect(updatedSession.ticket).toEqual({
            uid: "GL1-123",
            name: "Ticket sans titre",
            content: "<p>Ticket sans contenu</p>",
            status: Status.Assigned,
            userRequester: [77],
            userAssignedTo: [55],
            userWatcher: [],
            computerName: "wiserthanme",
            type: Type.Incident,
            entity: { id: 1, name: "entity1", itsmCode: "GL1" },
            resources: [],
        });
        expect(updatedSession.stacktrace.at(-2)).toEqual({
            data: { messages: [], ticketUid: "GL1-123" },
            message: "axios failed",
            source: "saveChatHistory",
        });
    });
});
