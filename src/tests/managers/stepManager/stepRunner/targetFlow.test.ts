import { sessionBuilder } from "../../../../managers/sessionManager";
import { stepRunner } from "../../../../managers/stepManager";
import { SessionStatus, StepCoord } from "../../../../types";
import * as NLU from "../../../../managers/nlu";
import { connect, clear, close } from "../../../helper";

beforeAll(async () => {
    await connect();
});

afterEach(async () => {
    await clear();
});

afterAll(async () => {
    await close();
});

describe("targetFlow", () => {
    test("Should use mapping to target correct flow", async () => {
        const newSession = await sessionBuilder({
            stacktrace: [],
            nextStep: { stepId: 1, flow: "mocker" },
            flow: "hello",
            status: SessionStatus.AVAILABLE,
            variables: {},
            history: [],
        });
        jest.spyOn(NLU, "findIntent").mockReturnValueOnce(Promise.resolve({ name: "hello", info: {} }));
        const sessionAndSay = await stepRunner(
            newSession,
            {
                description: "mock target different flow",
                name: "mocker",
                startingId: 1,
                steps: [
                    {
                        stepId: 1,
                        checkpoint: true,
                        waitForUserInput: true,
                        flow: "mocker",
                        action: "targetFlow",
                        follow: { nextCoord: { stepId: 1 } as StepCoord, fallbackCoord: { stepId: 1, flow: "mocker" } },
                    },
                ],
            },
            { message: "Let's go roboto" }
        );

        expect(sessionAndSay.session.nextStep).toEqual({ stepId: 1, flow: "hello" });
    });
    test("Should use starting id from targeted flow", async () => {
        const newSession = await sessionBuilder({
            stacktrace: [],
            nextStep: { stepId: 1, flow: "mocker" },
            flow: "hello",
            status: SessionStatus.AVAILABLE,
            variables: {},
            history: [],
        });
        jest.spyOn(NLU, "findIntent").mockReturnValueOnce(Promise.resolve({ name: "hello", info: {} }));
        const sessionAndSay = await stepRunner(
            newSession,
            {
                description: "mock target different flow",
                name: "mocker",
                startingId: 1,
                steps: [
                    {
                        stepId: 1,
                        checkpoint: true,
                        waitForUserInput: true,
                        flow: "mocker",
                        action: "targetFlow",
                        follow: { nextCoord: {} as StepCoord, fallbackCoord: { stepId: 1, flow: "mocker" } },
                    },
                ],
            },
            { message: "Let's go roboto" }
        );

        expect(sessionAndSay.session.nextStep).toEqual({ stepId: 1, flow: "hello" });
    });
});
