import * as sessionManager from "../../../../managers/sessionManager";
import { stepRunner } from "../../../../managers/stepManager";
import { mockAxios } from "../../../helper";
import { AxiosError } from "axios";
import { Step, SessionStatus, Ticket, ServiceName } from "@neomanis/neo-types";

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
describe("addKeyword", () => {
    test("should set nextStep with follow nextCoord if there is no ticket in session", async () => {
        mockAxios.mockResolvedValueOnce(Promise.resolve({}));
        const updatedSession = await stepRunner(
            session,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "addKeyword",
                        args: {
                            keyword: "system",
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
                message: "Hello roboto",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 2 });
    });
    test("should set nextStep with follow nextCoord if there is a ticket in session", async () => {
        mockAxios.mockResolvedValueOnce(Promise.resolve({}));
        const updatedSession = await stepRunner(
            {
                ...session,
                ticket: { uid: "GL1-123", name: "Default name", content: "Default content" } as Partial<Ticket>,
            },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "addKeyword",
                        args: {
                            keyword: "system",
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
                message: "Hello roboto",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 2 });
    });
    test("should set nextStep with follow fallbackCoord if axios error", async () => {
        mockAxios.mockRejectedValueOnce({
            isAxiosError: true,
            response: { statusText: "axios failed" },
        } as AxiosError);
        const updatedSession = await stepRunner(
            {
                ...session,
                ticket: { uid: "GL1-123", name: "Default name", content: "Default content" } as Partial<Ticket>,
            },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "addKeyword",
                        args: {
                            keyword: "system",
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
                message: "Hello roboto",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 1 });
        expect(updatedSession.stacktrace).toEqual([
            {
                data: {
                    keyword: "system",
                    ticketUid: "GL1-123",
                },
                message: "axios failed",
                source: "addKeyword",
            },
            {
                action: "addKeyword",
                args: {
                    keyword: "system",
                },
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
});
