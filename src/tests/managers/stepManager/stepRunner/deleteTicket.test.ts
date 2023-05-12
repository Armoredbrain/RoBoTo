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

describe("deleteTicket", () => {
    test("should succesfully delete ticket and follow nextCoord", async () => {
        mockAxios.mockResolvedValueOnce(Promise.resolve({}));
        const updatedSession = await stepRunner(
            { ...session, ticket },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "deleteTicket",
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
    test("should follow nextCoord if no ticket", async () => {
        const updatedSession = await stepRunner(
            session,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "deleteTicket",
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
    test("should follow fallbackCoord if delete ticket fails with axios error and update stacktrace", async () => {
        mockAxios.mockRejectedValueOnce({ isAxiosError: true, response: { statusText: "BAD REQUEST" } } as AxiosError);
        const updatedSession = await stepRunner(
            { ...session, ticket },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "deleteTicket",
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
        expect((updatedSession.stacktrace.at(-2) as CallError<unknown>).message).toEqual("BAD REQUEST");
    });
    test("should follow fallbackCoord if delete ticket fails with communication error and update stacktrace accordingly", async () => {
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
                        action: "deleteTicket",
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
        expect((updatedSession.stacktrace.at(-2) as CallError<unknown>).message).toEqual("ECONNREFUSED");
    });
});
