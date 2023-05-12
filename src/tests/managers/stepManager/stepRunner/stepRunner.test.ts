import { sessionBuilder } from "../../../../managers/sessionManager";
import { stepRunner } from "../../../../managers/stepManager";
import * as fileManager from "../../../../managers/fileManager";
import * as messageManager from "../../../../managers/messageManager";
import * as calls from "../../../../managers/calls";
import { Session } from "../../../../schemas/interfaces";
import { connect, clear, close } from "../../../helper";
import { Flow, Step, SessionStatus, Ticket, MessageType, Type } from "@neomanis/neo-types";

beforeAll(async () => {
    await connect();
});

afterEach(async () => {
    await clear();
});

afterAll(async () => {
    await close();
});

let session: Partial<Session>;
let flow: Flow;

beforeEach(() => {
    jest.clearAllMocks();
    flow = {
        name: "basic",
        description: "",
        startingId: 1,
        steps: [
            {
                id: 1,
                say: {
                    message: "Hello, I will handle your ticket: '${ticket.name}'",
                },
                follow: {
                    nextCoord: { flow: "basic", id: 2 },
                    fallbackCoord: { flow: "fallback", id: 1 },
                },
                flow: "basic",
                checkpoint: true,
                waitForUserInput: true,
            },
            {
                id: 2,
                say: {
                    message: "See you next time",
                },
                follow: {
                    nextCoord: { flow: "exit", id: 1 },
                    fallbackCoord: { flow: "fallback", id: 1 },
                },
                flow: "basic",
                checkpoint: false,
                waitForUserInput: false,
            },
        ],
    };
    session = {
        talkingToHuman: false,
        username: "toto",
        techName: "neobot",
        userNeoId: 77,
        neoBotId: 55,
        computerName: "wiserthanme",
        resourcesType: "PRINTER",
        stacktrace: [],
        flow: "basic",
        nextStep: { flow: "basic", id: 1 },
        status: SessionStatus.AVAILABLE,
        variables: {
            book: "printer",
        },
        history: [],
    };
});

describe("stepRunner", () => {
    test("Should handle step say and replace special wrapper with value from ticket session", async () => {
        const saveMessageHandlerSpy = jest
            .spyOn(messageManager, "saveMessageHandler")
            .mockReturnValue(Promise.resolve());
        const sendMessageSpy = jest.spyOn(calls, "sendMessage").mockReturnValue(Promise.resolve());

        const newSession = await sessionBuilder({
            ...session,
            ticket: { uid: "AAA-123-BBB", name: "I have trouble printing" } as Partial<Ticket>,
        });
        const updatedSession = await stepRunner(
            newSession,
            flow,
            { message: "Let's go roboto", sequencePosition: 0 },
            "jwtoken"
        );

        expect(saveMessageHandlerSpy).toHaveBeenCalledWith(
            expect.objectContaining({ computerName: "wiserthanme" }),
            {
                bot: {
                    message: "Hello, I will handle your ticket: 'I have trouble printing'",
                    options: undefined,
                    sequencePosition: 1,
                },
            },
            "jwtoken"
        );

        expect(sendMessageSpy).toHaveBeenCalledWith(
            {
                content: "Hello, I will handle your ticket: 'I have trouble printing'",
                options: [],
                sender: 55,
                recipients: [77],
                isPrivate: false,
                sequencePosition: 1,
                createdAt: expect.any(String),
                ticketUid: "AAA-123-BBB",
                type: MessageType.MESSAGE,
            },
            55,
            "jwtoken"
        );
        const lastStep = updatedSession.stacktrace[0] as Step;
        expect(lastStep.say).toEqual({ message: "Hello, I will handle your ticket: 'I have trouble printing'" });
        expect(updatedSession.checkpoint).toEqual({ id: 1, flow: "basic" });
        expect(updatedSession.nextStep).toEqual({ id: 2, flow: "basic" });
    });
    test("Should handle step say and replace special wrapper with an empty string if absent from session", async () => {
        const saveMessageHandlerSpy = jest
            .spyOn(messageManager, "saveMessageHandler")
            .mockReturnValue(Promise.resolve());
        const sendMessageSpy = jest.spyOn(calls, "sendMessage").mockReturnValue(Promise.resolve());

        const newSession = await sessionBuilder({
            ...session,
            ticket: { uid: "AAA-123-BBB" } as Partial<Ticket>,
        });
        const updatedSession = await stepRunner(
            newSession,
            flow,
            { message: "Let's go roboto", sequencePosition: 0 },
            "jwtoken"
        );

        expect(saveMessageHandlerSpy).toHaveBeenCalledWith(
            expect.objectContaining({ computerName: "wiserthanme" }),
            {
                bot: {
                    message: "Hello, I will handle your ticket: ''",
                    options: undefined,
                    sequencePosition: 1,
                },
            },
            "jwtoken"
        );

        expect(sendMessageSpy).toHaveBeenCalledWith(
            {
                content: "Hello, I will handle your ticket: ''",
                options: [],
                sender: 55,
                recipients: [77],
                isPrivate: false,
                sequencePosition: 1,
                createdAt: expect.any(String),
                ticketUid: "AAA-123-BBB",
                type: MessageType.MESSAGE,
            },
            55,
            "jwtoken"
        );
        const lastStep = updatedSession.stacktrace[0] as Step;
        expect(lastStep.say).toEqual({ message: "Hello, I will handle your ticket: ''" });
        expect(updatedSession.checkpoint).toEqual({ id: 1, flow: "basic" });
        expect(updatedSession.nextStep).toEqual({ id: 2, flow: "basic" });
    });
    test("Should handle step say and replace special wrapper with an empty string path point to a key in a string", async () => {
        const saveMessageHandlerSpy = jest
            .spyOn(messageManager, "saveMessageHandler")
            .mockReturnValue(Promise.resolve());
        const sendMessageSpy = jest.spyOn(calls, "sendMessage").mockReturnValue(Promise.resolve());

        const newSession = await sessionBuilder({
            ...session,
            ticket: { uid: "AAA-123-BBB", name: "something" } as Partial<Ticket>,
        });
        const updatedSession = await stepRunner(
            newSession,
            {
                ...flow,
                steps: [
                    {
                        id: 1,
                        say: {
                            message: "Hello, I will handle your ticket: '${ticket.name.vroom}'",
                        },
                        follow: {
                            nextCoord: { flow: "basic", id: 2 },
                            fallbackCoord: { flow: "fallback", id: 1 },
                        },
                        flow: "basic",
                        checkpoint: true,
                        waitForUserInput: true,
                    },
                    {
                        id: 2,
                        say: {
                            message: "See you next time",
                        },
                        follow: {
                            nextCoord: { flow: "exit", id: 1 },
                            fallbackCoord: { flow: "fallback", id: 1 },
                        },
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: false,
                    },
                ],
            },
            { message: "Let's go roboto", sequencePosition: 0 },
            "jwtoken"
        );

        expect(saveMessageHandlerSpy).toHaveBeenCalledWith(
            expect.objectContaining({ computerName: "wiserthanme" }),
            {
                bot: {
                    message: "Hello, I will handle your ticket: ''",
                    options: undefined,
                    sequencePosition: 1,
                },
            },
            "jwtoken"
        );

        expect(sendMessageSpy).toHaveBeenCalledWith(
            {
                content: "Hello, I will handle your ticket: ''",
                options: [],
                sender: 55,
                recipients: [77],
                isPrivate: false,
                sequencePosition: 1,
                createdAt: expect.any(String),
                ticketUid: "AAA-123-BBB",
                type: MessageType.MESSAGE,
            },
            55,
            "jwtoken"
        );
        const lastStep = updatedSession.stacktrace[0] as Step;
        expect(lastStep.say).toEqual({ message: "Hello, I will handle your ticket: ''" });
        expect(updatedSession.checkpoint).toEqual({ id: 1, flow: "basic" });
        expect(updatedSession.nextStep).toEqual({ id: 2, flow: "basic" });
    });
    test("Should handle step say and replace special wrapper with a formatted ticket uid if value in wrapper is `ticket.uid`", async () => {
        const saveMessageHandlerSpy = jest
            .spyOn(messageManager, "saveMessageHandler")
            .mockReturnValue(Promise.resolve());
        const sendMessageSpy = jest.spyOn(calls, "sendMessage").mockReturnValue(Promise.resolve());

        const newSession = await sessionBuilder({
            ...session,
            ticket: { uid: "AAA-123", name: "something", type: Type.Incident } as Partial<Ticket>,
        });
        const updatedSession = await stepRunner(
            newSession,
            {
                ...flow,
                steps: [
                    {
                        id: 1,
                        say: {
                            message: "Hello, I will handle your ticket: ${ticket.uid}",
                        },
                        follow: {
                            nextCoord: { flow: "basic", id: 2 },
                            fallbackCoord: { flow: "fallback", id: 1 },
                        },
                        flow: "basic",
                        checkpoint: true,
                        waitForUserInput: true,
                    },
                    {
                        id: 2,
                        say: {
                            message: "See you next time",
                        },
                        follow: {
                            nextCoord: { flow: "exit", id: 1 },
                            fallbackCoord: { flow: "fallback", id: 1 },
                        },
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: false,
                    },
                ],
            },
            { message: "Let's go roboto", sequencePosition: 0 },
            "jwtoken"
        );

        expect(saveMessageHandlerSpy).toHaveBeenCalledWith(
            expect.objectContaining({ computerName: "wiserthanme" }),
            {
                bot: {
                    message: "Hello, I will handle your ticket: [AAA] INC 123",
                    options: undefined,
                    sequencePosition: 1,
                },
            },
            "jwtoken"
        );

        expect(sendMessageSpy).toHaveBeenCalledWith(
            {
                content: "Hello, I will handle your ticket: [AAA] INC 123",
                options: [],
                sender: 55,
                recipients: [77],
                isPrivate: false,
                sequencePosition: 1,
                createdAt: expect.any(String),
                ticketUid: "AAA-123",
                type: MessageType.MESSAGE,
            },
            55,
            "jwtoken"
        );
        const lastStep = updatedSession.stacktrace[0] as Step;
        expect(lastStep.say).toEqual({ message: "Hello, I will handle your ticket: [AAA] INC 123" });
        expect(updatedSession.checkpoint).toEqual({ id: 1, flow: "basic" });
        expect(updatedSession.nextStep).toEqual({ id: 2, flow: "basic" });
    });
    test("Should handle step say and replace special wrapper with a formatted ticket uid if value in wrapper is `ticket.uid` without a type in ticket", async () => {
        const saveMessageHandlerSpy = jest
            .spyOn(messageManager, "saveMessageHandler")
            .mockReturnValue(Promise.resolve());
        const sendMessageSpy = jest.spyOn(calls, "sendMessage").mockReturnValue(Promise.resolve());

        const newSession = await sessionBuilder({
            ...session,
            ticket: { uid: "AAA-123", name: "something" } as Partial<Ticket>,
        });
        const updatedSession = await stepRunner(
            newSession,
            {
                ...flow,
                steps: [
                    {
                        id: 1,
                        say: {
                            message: "Hello, I will handle your ticket: ${ticket.uid}",
                        },
                        follow: {
                            nextCoord: { flow: "basic", id: 2 },
                            fallbackCoord: { flow: "fallback", id: 1 },
                        },
                        flow: "basic",
                        checkpoint: true,
                        waitForUserInput: true,
                    },
                    {
                        id: 2,
                        say: {
                            message: "See you next time",
                        },
                        follow: {
                            nextCoord: { flow: "exit", id: 1 },
                            fallbackCoord: { flow: "fallback", id: 1 },
                        },
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: false,
                    },
                ],
            },
            { message: "Let's go roboto", sequencePosition: 0 },
            "jwtoken"
        );

        expect(saveMessageHandlerSpy).toHaveBeenCalledWith(
            expect.objectContaining({ computerName: "wiserthanme" }),
            {
                bot: {
                    message: "Hello, I will handle your ticket: [AAA] 123",
                    options: undefined,
                    sequencePosition: 1,
                },
            },
            "jwtoken"
        );

        expect(sendMessageSpy).toHaveBeenCalledWith(
            {
                content: "Hello, I will handle your ticket: [AAA] 123",
                options: [],
                sender: 55,
                recipients: [77],
                isPrivate: false,
                sequencePosition: 1,
                createdAt: expect.any(String),
                ticketUid: "AAA-123",
                type: MessageType.MESSAGE,
            },
            55,
            "jwtoken"
        );
        const lastStep = updatedSession.stacktrace[0] as Step;
        expect(lastStep.say).toEqual({ message: "Hello, I will handle your ticket: [AAA] 123" });
        expect(updatedSession.checkpoint).toEqual({ id: 1, flow: "basic" });
        expect(updatedSession.nextStep).toEqual({ id: 2, flow: "basic" });
    });
    test("Should handle step say and replace special wrapper with a formatted ticket uid if value in wrapper is `variable.book`", async () => {
        const saveMessageHandlerSpy = jest
            .spyOn(messageManager, "saveMessageHandler")
            .mockReturnValue(Promise.resolve());
        const sendMessageSpy = jest.spyOn(calls, "sendMessage").mockReturnValue(Promise.resolve());

        const newSession = await sessionBuilder(session);
        const updatedSession = await stepRunner(
            newSession,
            {
                ...flow,
                steps: [
                    {
                        id: 1,
                        say: {
                            message: "Hello, I will handle your book: ${variables.book}",
                        },
                        follow: {
                            nextCoord: { flow: "basic", id: 2 },
                            fallbackCoord: { flow: "fallback", id: 1 },
                        },
                        flow: "basic",
                        checkpoint: true,
                        waitForUserInput: true,
                    },
                    {
                        id: 2,
                        say: {
                            message: "See you next time",
                        },
                        follow: {
                            nextCoord: { flow: "exit", id: 1 },
                            fallbackCoord: { flow: "fallback", id: 1 },
                        },
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: false,
                    },
                ],
            },
            { message: "Let's go roboto", sequencePosition: 0 },
            "jwtoken"
        );

        expect(saveMessageHandlerSpy).toHaveBeenCalledWith(
            expect.objectContaining({ computerName: "wiserthanme" }),
            {
                bot: {
                    message: "Hello, I will handle your book: printer",
                    options: undefined,
                    sequencePosition: 1,
                },
            },
            "jwtoken"
        );

        expect(sendMessageSpy).toHaveBeenCalledWith(
            {
                content: "Hello, I will handle your book: printer",
                options: [],
                sender: 55,
                recipients: [77],
                isPrivate: false,
                sequencePosition: 1,
                createdAt: expect.any(String),
                type: MessageType.MESSAGE,
            },
            55,
            "jwtoken"
        );
        const lastStep = updatedSession.stacktrace[0] as Step;
        expect(lastStep.say).toEqual({ message: "Hello, I will handle your book: printer" });
        expect(updatedSession.checkpoint).toEqual({ id: 1, flow: "basic" });
        expect(updatedSession.nextStep).toEqual({ id: 2, flow: "basic" });
    });
    test("Should push an error into stacktrace if encountering a save message error", async () => {
        jest.spyOn(messageManager, "saveMessageHandler").mockRejectedValue(
            new calls.CallError("saveMessage", "UNAUTHORIZED ACCESS", {
                bot: {
                    message: "Hello, I will handle your ticket: 'I have trouble printing'",
                    options: undefined,
                    sequencePosition: 1,
                },
            })
        );
        jest.spyOn(calls, "sendMessage").mockResolvedValue(
            Promise.resolve(
                new calls.CallError("sendMessage", "FORBIDDEN ACCESS", {
                    message: {
                        content: "Hello, I will handle your ticket: 'I have trouble printing'",
                        options: [],
                        sender: 55,
                        recipients: [77],
                        isPrivate: false,
                        sequencePosition: 1,
                        createdAt: expect.any(String),
                        ticketUid: "GL1-123",
                        type: MessageType.MESSAGE,
                    },
                })
            )
        );
        const newSession = await sessionBuilder({
            ...session,
            ticket: { uid: "AAA-123-BBB", name: "I have trouble printing" } as Partial<Ticket>,
        });
        const updatedSession = await stepRunner(
            newSession,
            flow,
            { message: "Let's go roboto", sequencePosition: 0 },
            "jwtoken"
        );

        const lastStep = updatedSession.stacktrace[0] as Step;
        expect(lastStep.say).toEqual({ message: "Hello, I will handle your ticket: 'I have trouble printing'" });
        expect(updatedSession.checkpoint).toEqual({ id: 1, flow: "basic" });
        expect(updatedSession.nextStep).toEqual({ id: 2, flow: "basic" });
        expect(updatedSession.stacktrace).toEqual([
            {
                checkpoint: true,
                flow: "basic",
                follow: {
                    fallbackCoord: {
                        flow: "fallback",
                        id: 1,
                    },
                    nextCoord: {
                        flow: "basic",
                        id: 2,
                    },
                },
                id: 1,
                say: {
                    message: "Hello, I will handle your ticket: 'I have trouble printing'",
                },
                waitForUserInput: true,
            },
            {
                data: {
                    bot: {
                        message: "Hello, I will handle your ticket: 'I have trouble printing'",
                        options: undefined,
                        sequencePosition: 1,
                    },
                },
                message: "UNAUTHORIZED ACCESS",
                source: "saveMessage",
            },
            {
                data: {
                    message: {
                        content: "Hello, I will handle your ticket: 'I have trouble printing'",
                        recipients: [77],
                        sender: 55,
                        createdAt: expect.any(String),
                        isPrivate: false,
                        ticketUid: "GL1-123",
                        options: [],
                        sequencePosition: 1,
                        type: MessageType.MESSAGE,
                    },
                },
                message: "FORBIDDEN ACCESS",
                source: "sendMessage",
            },
        ]);
    });
    test("Should handle recursivity and flow switch if step has waitForUserInput set to false and follow coord has a different flow than current flow", async () => {
        jest.spyOn(messageManager, "saveMessageHandler").mockReturnValue(Promise.resolve());
        const spySendMessage = jest.spyOn(calls, "sendMessage").mockReturnValue(Promise.resolve());
        const newSession = await sessionBuilder({ ...session, nextStep: { id: 2, flow: "basic" } });
        jest.spyOn(fileManager, "fileReader").mockReturnValue({
            name: "exit",
            description: "",
            startingId: 1,
            steps: [
                {
                    id: 1,
                    flow: "exit",
                    follow: {
                        nextCoord: { id: 2, flow: "exit" },
                        fallbackCoord: { id: 2, flow: "exit" },
                    },
                    say: {
                        message: "I will handle your departure",
                    },
                    waitForUserInput: true,
                    checkpoint: true,
                },
            ],
        });
        const updatedSession = await stepRunner(
            newSession,
            flow,
            { message: "Let's go roboto", sequencePosition: 0 },
            "jwtoken"
        );

        expect(spySendMessage).toHaveBeenNthCalledWith(
            1,
            {
                content: "See you next time",
                createdAt: expect.any(String),
                isPrivate: false,
                options: [],
                recipients: [77],
                sender: 55,
                sequencePosition: 1,
                type: MessageType.MESSAGE,
            },
            55,
            "jwtoken"
        );
        expect(spySendMessage).toHaveBeenNthCalledWith(
            2,
            {
                content: "I will handle your departure",
                createdAt: expect.any(String),
                isPrivate: false,
                options: [],
                recipients: [77],
                sender: 55,
                sequencePosition: 1,
                type: MessageType.MESSAGE,
            },
            55,
            "jwtoken"
        );
        expect(updatedSession.checkpoint).toEqual({ id: 1, flow: "exit" });
        expect(updatedSession.nextStep).toEqual({ id: 2, flow: "exit" });
        expect(updatedSession.stacktrace.length).toEqual(2);
    });
});
