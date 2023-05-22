import * as sessionManager from "../../../../managers/sessionManager";
import { stepRunner } from "../../../../managers/stepManager";
import { SessionStatus, Step } from "../../../../types";

const session = {
    id: "aaaaaaaaaaaaaaaaaaaaaaaa",
    stacktrace: [] as Step[],
    flow: "basic",
    nextStep: { flow: "basic", id: 1 },
    status: SessionStatus.AVAILABLE,
    variables: {},
    history: [],
    checkpoint: { id: 1, flow: "basic" },
};

describe("saveSessionVariablesWithUserInput", () => {
    test("should save variables from step args with user input to session and return nextCoord", async () => {
        jest.spyOn(sessionManager, "updateSession").mockReturnValue(Promise.resolve());
        const updatedSession = await stepRunner(
            session,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "saveSessionVariablesWithUserInput",
                        args: {
                            dynamicVariable: "",
                        },
                        follow: {
                            nextCoord: { flow: "basic", id: 2 },
                            fallbackCoord: { flow: "fallback", id: 1 },
                        },
                        flow: "basic",
                        checkpoint: true,
                        waitForUserInput: true,
                    },
                    {
                        id: 2,
                        follow: {
                            nextCoord: { flow: "basic", id: 1 },
                            fallbackCoord: { flow: "fallback", id: 1 },
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
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 2 });
        expect(updatedSession.variables).toEqual({ dynamicVariable: "toto is here" });
    });
});
