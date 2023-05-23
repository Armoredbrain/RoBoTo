import * as sessionManager from "../../../../managers/sessionManager";
import { stepRunner } from "../../../../managers/stepManager";
import { SessionStatus, Step } from "../../../../types";

const session = {
    id: "aaaaaaaaaaaaaaaaaaaaaaaa",
    stacktrace: [] as Step[],
    flow: "basic",
    nextStep: { flow: "basic", stepId: 1 },
    status: SessionStatus.AVAILABLE,
    variables: {},
    history: [],
    checkpoint: { flow: "hello", stepId: 3 },
};

describe("saveSessionVariables", () => {
    test("should save variables from step args to session and return nextCoord", async () => {
        jest.spyOn(sessionManager, "updateSession").mockImplementation(async () => Promise.resolve());
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
        const sessionAndSay = await stepRunner(
            session,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        stepId: 1,
                        action: "saveSessionVariables",
                        args,
                        follow: {
                            nextCoord: { flow: "basic", stepId: 1 },
                            fallbackCoord: { flow: "fallback", stepId: 1 },
                        },
                        flow: "basic",
                        checkpoint: true,
                        waitForUserInput: true,
                    },
                ],
            },
            {
                message: "",
            }
        );
        expect(sessionAndSay.session.nextStep).toEqual({ flow: "basic", stepId: 1 });
        expect(sessionAndSay.session.variables).toEqual(args);
    });
});
