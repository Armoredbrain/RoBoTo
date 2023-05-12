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
    variables: {},
    history: [],
    entity: { id: 1, itsmCode: "IT1" },
    platform: ServiceName.NEO_HELPER,
};

jest.spyOn(sessionManager, "updateSession").mockImplementation(async () => Promise.resolve());

describe("saveSessionVariables", () => {
    test("should save variables from step args to session and return nextCoord", async () => {
        const args = {
            test: "Reflect",
            result: true,
            executionTime: 0.8,
            outputs: ["array", "with", "data"],
            target: {
                step: 1,
                action: "saveSessionVariables",
            },
        };
        const updatedSession = await stepRunner(
            session,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "saveSessionVariables",
                        args,
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
        expect(updatedSession.variables).toEqual(args);
    });
});
