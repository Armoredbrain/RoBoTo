import * as sessionManager from "../../../../managers/sessionManager";
import { stepRunner } from "../../../../managers/stepManager";
import { SessionStatus, Step } from "../../../../types";

const session = {
    id: "aaaaaaaaaaaaaaaaaaaaaaaa",
    stacktrace: [] as Step[],
    flow: "basic",
    nextStep: { flow: "basic", id: 1 },
    status: SessionStatus.AVAILABLE,
    variables: {
        book: "printer",
    },
    history: [],
    checkpoint: { flow: "hello", id: 1 },
};

describe("endSession", () => {
    test("should close current session and return nextCoord", async () => {
        jest.spyOn(sessionManager, "updateSession").mockImplementation(async () => Promise.resolve());
        const updateSession = await stepRunner(
            session,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "endSession",
                        args: {},
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
            }
        );
        expect(updateSession.nextStep).toEqual({ flow: "basic", id: 1 });
        expect(updateSession.status).toEqual(SessionStatus.CLOSED);
    });
});
