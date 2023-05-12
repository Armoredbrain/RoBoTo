import { Step, SessionStatus, Status, Type, Ticket, ServiceName } from "@neomanis/neo-types";
import * as sessionManager from "../../../../managers/sessionManager";
import { stepRunner } from "../../../../managers/stepManager";

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
describe("setResource", () => {
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
                        action: "setResource",
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                        args: { type: "PRINTER", resourceIdKey: "printerID" },
                        follow: {
                            nextCoord: { id: 2, flow: "basic" },
                            fallbackCoord: { id: 1, flow: "basic" },
                        },
                    },
                ],
            },
            {
                message: "Here is my choice",
                option: { value: 1, label: "Toto printer" },
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 1 });
    });
    test("should set nextStep with follow fallbackCoord if there is no chosen option in user say", async () => {
        const updatedSession = await stepRunner(
            {
                ...session,
                ticket: { uid: "GL1-123", name: "Default name", content: "Default content" } as Ticket,
            },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "setResource",
                        flow: "basic",
                        checkpoint: false,
                        args: { type: "PRINTER", resourceIdKey: "printerID" },
                        waitForUserInput: true,
                        follow: {
                            nextCoord: { id: 2, flow: "basic" },
                            fallbackCoord: { id: 1, flow: "basic" },
                        },
                    },
                ],
            },
            {
                message: "Here is my choice",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 1 });
    });
    test("should set nextStep with follow fallbackCoord if there is option with value equal or below 0", async () => {
        const updatedSession = await stepRunner(
            {
                ...session,
                ticket: { uid: "GL1-123", name: "Default name", content: "Default content" } as Ticket,
            },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "setResource",
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                        args: { type: "PRINTER", resourceIdKey: "printerID" },
                        follow: {
                            nextCoord: { id: 2, flow: "basic" },
                            fallbackCoord: { id: 1, flow: "basic" },
                        },
                    },
                ],
            },
            {
                message: "Here is my choice",
                option: { value: 0, label: "Can't find my resource" },
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 1 });
    });
    test("should set nextStep with follow nextCoord if everything goes well", async () => {
        const updatedSession = await stepRunner(
            {
                ...session,
                ticket: {
                    uid: "GL1-123",
                    name: "Default name",
                    content: "Default content",
                    resources: [],
                    userAssignedTo: [],
                    userRequester: [],
                    userWatcher: [],
                    status: Status.New,
                    entityId: 12,
                    type: Type.Incident,
                } as Partial<Ticket>,
                variables: {
                    resources: [
                        {
                            contact: "toto",
                            entity: { id: 2, name: "entity2", istmCode: "GL" },
                            id: 4,
                            name: "CEREBRO",
                        },
                        {
                            contact: "toto",
                            entity: { id: 2, name: "entity2", istmCode: "GL" },
                            id: 1,
                            name: "Xerox2",
                        },
                    ],
                },
            },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "setResource",
                        flow: "basic",
                        checkpoint: false,
                        args: { type: "PRINTER", resourceIdKey: "printerID" },
                        waitForUserInput: true,
                        follow: {
                            nextCoord: { id: 2, flow: "basic" },
                            fallbackCoord: { id: 1, flow: "basic" },
                        },
                    },
                ],
            },
            {
                message: "Here is my choice",
                option: { value: 1, label: "Xerox2" },
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 2 });
        expect(updatedSession.variables).toEqual({
            printerID: "Xerox2",
            resources: [
                {
                    contact: "toto",
                    entity: {
                        id: 2,
                        istmCode: "GL",
                        name: "entity2",
                    },
                    id: 4,
                    name: "CEREBRO",
                },
                {
                    contact: "toto",
                    entity: {
                        id: 2,
                        istmCode: "GL",
                        name: "entity2",
                    },
                    id: 1,
                    name: "Xerox2",
                },
            ],
        });
        expect(updatedSession.ticket?.resources).toEqual([
            {
                item: { id: 1, name: "Xerox2", contact: "toto", entity: { id: 2, name: "entity2", istmCode: "GL" } },
                type: "PRINTER",
                tickets: [],
            },
        ]);
    });
});
