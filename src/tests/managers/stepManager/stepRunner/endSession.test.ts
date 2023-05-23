import * as sessionManager from "../../../../managers/sessionManager";
import { stepRunner } from "../../../../managers/stepManager";
import { SessionStatus, Step } from "../../../../types";

const session = {
    id: "aaaaaaaaaaaaaaaaaaaaaaaa",
    stacktrace: [] as Step[],
    flow: "basic",
    nextStep: { flow: "basic", stepId: 1 },
    status: SessionStatus.AVAILABLE,
    variables: {
        book: "printer",
    },
    history: [],
    checkpoint: { flow: "hello", stepId: 1 },
};

describe("endSession", () => {
    test("should close current session and return nextCoord", async () => {
        jest.spyOn(sessionManager, "updateSession").mockImplementation(async () => Promise.resolve());
        const sessionAndSay = await stepRunner(
            session,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        stepId: 1,
                        action: "endSession",
                        args: {},
                        follow: {
                            nextCoord: { flow: "basic", stepId: 1 },
                            fallbackCoord: { flow: "fallback", stepId: 1 },
                        },
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                    },
                ],
            },
            {
                message: "",
            }
        );
        expect(sessionAndSay.session.nextStep).toEqual({ flow: "basic", stepId: 1 });
        expect(sessionAndSay.session.status).toEqual(SessionStatus.CLOSED);
    });
});
