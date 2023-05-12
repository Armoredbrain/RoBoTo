import { Step, SessionStatus, ServiceName } from "@neomanis/neo-types";
import * as sessionManager from "../../../../managers/sessionManager";
import { stepRunner } from "../../../../managers/stepManager";

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
describe("checkDiagnosticsResults", () => {
    test("should set nextStep to corresponding diagnostic exit type", async () => {
        const updatedSession = await stepRunner(
            { ...session, diagnosticExitType: "escalate" },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "checkDiagnosticsResults",
                        args: {},
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                        results: {
                            escalate: { flow: "orchestrator", id: 7 },
                            confirmation: { flow: "orchestrator", id: 3 },
                            solved: { flow: "orchestrator", id: 5 },
                            error: { flow: "orchestrator", id: 6 },
                            approval: { flow: "orchestrator", id: 8 },
                        },
                    } as Step,
                ],
            },
            {
                message: "Here we go",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "orchestrator", id: 7 });
    });
});
