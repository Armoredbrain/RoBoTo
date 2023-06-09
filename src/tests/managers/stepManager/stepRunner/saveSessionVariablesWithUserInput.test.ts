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
    checkpoint: { stepId: 1, flow: "basic" },
};

describe("saveSessionVariablesWithUserInput", () => {
    test("should save variables from step args with user input to session and return nextCoord", async () => {
        jest.spyOn(sessionManager, "updateSession").mockReturnValue(Promise.resolve());
        const sessionAndSay = await stepRunner(
            session,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        stepId: 1,
                        action: "saveSessionVariablesWithUserInput",
                        args: {
                            dynamicVariable: "",
                        },
                        follow: {
                            nextCoord: { flow: "basic", stepId: 2 },
                            fallbackCoord: { flow: "fallback", stepId: 1 },
                        },
                        flow: "basic",
                        checkpoint: true,
                        waitForUserInput: true,
                    },
                    {
                        stepId: 2,
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
                message: "toto is here",
            }
        );
        expect(sessionAndSay.session.nextStep).toEqual({ flow: "basic", stepId: 2 });
        expect(sessionAndSay.session.variables).toEqual({ dynamicVariable: "toto is here" });
    });
});
