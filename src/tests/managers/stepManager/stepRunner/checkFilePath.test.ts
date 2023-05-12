import * as db from "../../../helper";
import * as sessionManager from "../../../../managers/sessionManager";
import { stepRunner } from "../../../../managers/stepManager";
import { Session } from "../../../../schemas/interfaces";
import { AxiosError } from "axios";
import { CallError } from "../../../../managers/calls";
import { Step, SessionStatus, Ticket, ServiceName } from "@neomanis/neo-types";

jest.mock("axios");

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

describe("checkFilePath", () => {
    test("Should handle checkFilePath action and update ticket content with user message", async () => {
        db.mockAxios.mockResolvedValueOnce(Promise.resolve({ data: { uid: "GL1-12" } }));
        const updatedSession = await stepRunner(
            { ...session, ticket: { uid: "GL1-12" } as Partial<Ticket> },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "checkFilePath",
                        args: {
                            content: "I cannot open this file :",
                        },
                        follow: {
                            nextCoord: { flow: "basic", id: 1 },
                            fallbackCoord: { flow: "basic", id: 1 },
                        },
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                    },
                ],
            },
            {
                message: "/home/Document",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.ticket?.content).toEqual("<p>I cannot open this file : /home/Document</p>");
    });
    test("Should handle checkFilePath action and add user message to ticket.content", async () => {
        db.mockAxios.mockResolvedValueOnce(Promise.resolve({ data: { uid: "GL1-2" } }));
        const updatedSession = await stepRunner(
            { ...session, ticket: { uid: "GL1-2", content: "File damaged" } as Partial<Ticket> },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "checkFilePath",
                        args: {
                            content: "I cannot open this file :",
                        },
                        follow: {
                            nextCoord: { flow: "basic", id: 1 },
                            fallbackCoord: { flow: "basic", id: 1 },
                        },
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                    },
                ],
            },
            {
                message: "/home/tests",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.ticket?.content).toEqual("<p>File damaged I cannot open this file : /home/tests</p>");
    });
    test("Should handle checkFilePath action fail and update updatedSession.nextStep to fallBackCoord", async () => {
        const updatedSession = await stepRunner(
            session,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "checkFilePath",
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
                message: "Bye",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "fallback", id: 1 });
    });
    test("Should handle checkFilePath action fail and update stackTrace if axiosCall to update ticket fails", async () => {
        db.mockAxios.mockRejectedValueOnce({ isAxiosError: true, response: { statusText: "Not Found" } } as AxiosError);
        const updatedSession = await stepRunner(
            { ...session, ticket: { uid: "GL1-12" } as Partial<Ticket> },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "checkFilePath",
                        args: {
                            content: "I cannot open this file :",
                        },
                        follow: {
                            nextCoord: { flow: "basic", id: 1 },
                            fallbackCoord: { flow: "basic", id: 1 },
                        },
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                    },
                ],
            },
            {
                message: "/home/Document",
                sequencePosition: 0,
            },
            "jwtoken"
        );

        const stackedError = updatedSession.stacktrace.at(-2);
        expect(updatedSession.ticket?.content).toEqual("<p>I cannot open this file : /home/Document</p>");
        expect((stackedError! as CallError<unknown>).message).toEqual("Not Found");
    });
    test("Should handle checkFilePath action fail and update stackTrace if axiosCall to update ticket fails", async () => {
        db.mockAxios.mockRejectedValueOnce({ code: "ECONNREFUSED", message: "ECONNREFUSED" });
        const updatedSession = await stepRunner(
            { ...session, ticket: { uid: "GL1-12" } as Partial<Ticket> },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "checkFilePath",
                        args: {
                            content: "I cannot open this file :",
                        },
                        follow: {
                            nextCoord: { flow: "basic", id: 1 },
                            fallbackCoord: { flow: "basic", id: 1 },
                        },
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                    },
                ],
            },
            {
                message: "/home/Document",
                sequencePosition: 0,
            },
            "jwtoken"
        );

        const stackedError = updatedSession.stacktrace.at(-2);
        expect(updatedSession.ticket?.content).toEqual("<p>I cannot open this file : /home/Document</p>");
        expect((stackedError! as CallError<unknown>).message).toEqual("ECONNREFUSED");
    });
});
