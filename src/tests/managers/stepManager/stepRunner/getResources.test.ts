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
describe("getResources", () => {
    test("should set nextStep with follow fallbackCoord if there is no ticket in session", async () => {
        const updatedSession = await stepRunner(
            session,

            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "getResources",
                        args: {
                            resourcesType: "System",
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
    });
    test("should set nextStep with follow fallbackCoord if there is no args in step", async () => {
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
                        action: "getResources",
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
    });
    test("should set nextStep with follow fallbackCoord if there getResources return a CallError", async () => {
        mockAxios.mockRejectedValueOnce({
            isAxiosError: true,
            response: { statusText: "axios failed" },
        } as AxiosError);
        const updatedSession = await stepRunner(
            {
                ...session,
                ticket: {
                    uid: "GL1-123",
                    name: "Default name",
                    content: "Default content",
                    userAssignedTo: [12],
                    userWatcher: [] as number[],
                } as Partial<Ticket>,
            },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "getResources",
                        say: {
                            message: "Hello user, choose one option",
                            options: [
                                { label: "system", value: 1 },
                                { label: "network", value: 2 },
                            ],
                        },
                        args: {
                            resourcesType: "COMPUTER",
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
                    itsmCode: "GL1",
                    resourcesType: "Computer",
                },
                message: "axios failed",
                source: "getResources",
            },
            {
                action: "getResources",
                say: {
                    message: "Hello user, choose one option",
                    options: [
                        { label: "system", value: 1 },
                        { label: "network", value: 2 },
                    ],
                },
                args: {
                    resourcesType: "COMPUTER",
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
    test("should set nextStep with follow fallbackCoord if there is no args in step", async () => {
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
                        action: "getResources",
                        flow: "basic",
                        args: {
                            resourcesType: "COMPUTER",
                        },
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
        expect(updatedSession.stacktrace).toEqual([
            {
                action: "getResources",
                args: {
                    resourcesType: "COMPUTER",
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
    test("should set nextStep with follow nextCoord if everything goes well", async () => {
        mockAxios.mockResolvedValueOnce(
            Promise.resolve({
                data: {
                    resourcesByCategory: [
                        {
                            itsmCode: "GL1",
                            resources: [
                                { id: 1, name: "Toto computeur" },
                                { id: 2, name: "Michel computer" },
                            ],
                        },
                    ],
                },
            })
        );
        const updatedSession = await stepRunner(
            {
                ...session,
                ticket: {
                    uid: "GL1-123",
                    name: "Default name",
                    content: "Default content",
                    userAssignedTo: [12],
                    userWatcher: [] as number[],
                } as Partial<Ticket>,
            },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "getResources",
                        say: {
                            message: "Hello user, choose one option",
                            options: [{ label: "Cannot find my resource", value: 0 }],
                        },
                        args: {
                            resourcesType: "COMPUTER",
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
        const lastStep = updatedSession.stacktrace.at(-1) as Step;
        expect(lastStep.say?.options).toEqual([
            { label: "Toto computeur", value: 1 },
            { label: "Michel computer", value: 2 },
            { label: "Cannot find my resource", value: 0 },
        ]);
        expect(updatedSession.stacktrace).toEqual([
            {
                action: "getResources",
                args: {
                    resourcesType: "COMPUTER",
                },
                say: {
                    message: "Hello user, choose one option",
                    options: [
                        { label: "Toto computeur", value: 1 },
                        { label: "Michel computer", value: 2 },
                        { label: "Cannot find my resource", value: 0 },
                    ],
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
