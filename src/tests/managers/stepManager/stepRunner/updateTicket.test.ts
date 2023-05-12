import * as sessionManager from "../../../../managers/sessionManager";
import { mockAxios } from "../../../helper";
import { stepRunner } from "../../../../managers/stepManager";
import { CallError } from "../../../../managers/calls";
import { Session } from "../../../../schemas/interfaces";
import { AxiosError } from "axios";
import { Step, SessionStatus, Status, Ticket, Resource, ServiceName } from "@neomanis/neo-types";

jest.mock("axios");
let ticket: Partial<Ticket>;
let session: Session;

beforeEach(() => {
    ticket = {
        uid: "GL1-2",
        name: "Ticket sans titre",
        content: "<p>Ticket sans contenu</p>",
        status: Status.Assigned,
        userRequester: [77],
        userAssignedTo: [55],
        userWatcher: [],
        type: 1,
        entityId: 1,
        resources: [] as Resource[],
    };
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

describe("updateTicketWithUserInput", () => {
    test("should update ticket using user inputs", async () => {
        mockAxios.mockResolvedValueOnce(Promise.resolve({ data: { uid: "GL1-2" } }));
        const updatedSession = await stepRunner(
            { ...session, ticket },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "updateTicketWithUserInput",
                        args: {
                            content: "",
                        },
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
                message: "I cannot open this file",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 1 });
        expect(updatedSession.ticket?.content).toEqual("<p>I cannot open this file</p>");
    });
});

describe("updateTicket", () => {
    test("should update ticket using user step args", async () => {
        mockAxios.mockResolvedValueOnce(Promise.resolve({ data: { uid: "GL1-2" } }));
        const updatedSession = await stepRunner(
            { ...session, ticket },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "updateTicket",
                        args: {
                            content: "I cannot open this file",
                            name: "newName",
                            category: "Printer",
                            wrongKey: "notAdded",
                        },
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
                message: "aaaaaaaaahhhhhh",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 1 });
        expect(updatedSession.ticket?.content).toEqual("<p>I cannot open this file</p>");
        expect(updatedSession.ticket?.name).toEqual("newName");
        expect(updatedSession.ticket?.category).toEqual("Printer");
        expect(updatedSession.ticket?.uid).toEqual("GL1-2");
        expect(Reflect.get(updatedSession.ticket!, "wrongKey")).toBeUndefined();
    });
    test("should not update ticket and set nextStep to fallback if no ticket", async () => {
        const updatedSession = await stepRunner(
            session,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "updateTicket",
                        args: {
                            content: "I cannot open this file",
                            name: "newName",
                            category: "Printer",
                            wrongKey: "notAdded",
                        },
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
                message: "aaaaaaaaahhhhhh",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "fallback", id: 1 });
    });
    test("should not update ticket and set nextStep to fallback if update ticket fails with axios error", async () => {
        mockAxios.mockRejectedValueOnce({ isAxiosError: true, response: { statusText: "Bad Request" } } as AxiosError);
        const updatedSession = await stepRunner(
            { ...session, ticket },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "updateTicket",
                        args: {
                            content: "I cannot open this file",
                            name: "newName",
                            category: "Printer",
                            wrongKey: "notAdded",
                        },
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
                message: "aaaaaaaaahhhhhh",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "fallback", id: 1 });
        expect((updatedSession.stacktrace.at(-2) as CallError<unknown>).message).toEqual("Bad Request");
    });
    test("should not update ticket and set nextStep to fallback if update ticket fails with communication error", async () => {
        mockAxios.mockRejectedValueOnce({ code: "ECONNREFUSED", message: "ECONNREFUSED" });
        const updatedSession = await stepRunner(
            { ...session, ticket },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "updateTicket",
                        args: {
                            content: "I cannot open this file",
                            name: "newName",
                            category: "Printer",
                            wrongKey: "notAdded",
                        },
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
                message: "aaaaaaaaahhhhhh",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "fallback", id: 1 });
        expect((updatedSession.stacktrace.at(-2) as CallError<unknown>).message).toEqual("ECONNREFUSED");
    });
});
