import * as sessionManager from "../../../../managers/sessionManager";
import * as flowManager from "../../../../managers/flowManager";
import { stepRunner } from "../../../../managers/stepManager";
import { Step, SessionStatus, Ticket, ServiceName } from "@neomanis/neo-types";

const session = {
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

jest.spyOn(sessionManager, "updateSession").mockImplementation(async () => Promise.resolve());
describe("flowGate", () => {
    test("should set nextStep starting id of found flow corresponding to user say intent and fill up ticket content with user say", async () => {
        jest.spyOn(flowManager, "flowGate").mockReturnValue(Promise.resolve({ id: 1, flow: "system" }));
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
                        action: "flowGate",
                        args: {},
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                        follow: {
                            nextCoord: { id: 1, flow: "system" },
                            fallbackCoord: { id: 1, flow: "basic" },
                        },
                    },
                ],
            },
            {
                message: "Here we go to system bug resolution",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "system", id: 1 });
        expect(updatedSession.ticket?.content).toEqual("Here we go to system bug resolution");
    });
    test("should set nextStep starting id of found flow corresponding to user choosen option fill up ticket content with user option label", async () => {
        jest.spyOn(flowManager, "flowGate").mockReturnValue(Promise.resolve({ id: 1, flow: "system" }));
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
                        action: "flowGate",
                        args: {},
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                        follow: {
                            nextCoord: { id: 1, flow: "system" },
                            fallbackCoord: { id: 1, flow: "basic" },
                        },
                    },
                ],
            },
            {
                message: "Here we go to system bug resolution",
                option: { label: "System trouble", value: "system_trouble_resolution" },
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "system", id: 1 });
        expect(updatedSession.ticket?.content).toEqual("system_trouble_resolution");
    });
});
