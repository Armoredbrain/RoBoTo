import { sessionBuilder } from "../../../../managers/sessionManager";
import { stepRunner } from "../../../../managers/stepManager";
import { connect, clear, close } from "../../../helper";
import { Flow, Session, SessionStatus, Step, StepCoord } from "../../../../types";
import { FLOWS, fileReader } from "../../../../managers/fileManager";
import * as NLU from "../../../../managers/nlu";

beforeAll(async () => {
    await connect();
});

afterEach(async () => {
    await clear();
});

afterAll(async () => {
    await close();
});

let session: Partial<Session>;
let flow: Flow;

beforeEach(() => {
    jest.clearAllMocks();
    flow = {
        name: "basic",
        description: "",
        startingId: 1,
        steps: [
            {
                stepId: 1,
                say: {
                    message: "Hello, your session flow is ${flow}",
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
                say: {
                    message: "See you next time ${echo.something}",
                },
                follow: {
                    nextCoord: { flow: "basic", stepId: 1 },
                    fallbackCoord: { flow: "fallback", stepId: 1 },
                },
                flow: "basic",
                checkpoint: false,
                waitForUserInput: false,
            },
        ],
    };
    session = {
        stacktrace: [],
        flow: "basic",
        nextStep: { flow: "basic", stepId: 1 },
        status: SessionStatus.AVAILABLE,
        variables: {},
        history: [],
    };
});

describe("stepRunner", () => {
    test("Should handle step say and replace special wrapper with value from session", async () => {
        const newSession = await sessionBuilder(session);
        const sessionAndSay = await stepRunner(newSession, flow, { message: "Let's go roboto" });
        const lastStep = sessionAndSay.session.stacktrace[0] as Step;
        expect(lastStep.say).toEqual({ message: "Hello, your session flow is basic" });
        expect(sessionAndSay.session.checkpoint).toEqual({ stepId: 1, flow: "basic" });
        expect(sessionAndSay.session.nextStep).toEqual({ stepId: 2, flow: "basic" });
        expect(sessionAndSay.say.message).toEqual("Hello, your session flow is basic");
    });
    test("Should handle step say and replace special wrapper with Hu ho if absent from session", async () => {
        const newSession = await sessionBuilder({ ...session, nextStep: { flow: "basic", stepId: 2 } });
        const sessionAndSay = await stepRunner(newSession, flow, { message: "Let's go roboto" });
        const lastStep = sessionAndSay.session.stacktrace[0] as Step;
        expect(lastStep.say).toEqual({ message: `See you next time Hu Ho` });
        expect(sessionAndSay.session.checkpoint).toEqual({ stepId: 1, flow: "basic" });
        expect(sessionAndSay.session.nextStep).toEqual({ stepId: 2, flow: "basic" });
        expect(sessionAndSay.say.message).toEqual("Hello, your session flow is basic");
    });
    test("Should handle step say and replace special wrapper with an empty string path point to a key in a string", async () => {
        const newSession = await sessionBuilder(session);
        const sessionAndSay = await stepRunner(
            newSession,
            {
                ...flow,
                steps: [
                    {
                        stepId: 1,
                        say: {
                            message: "Hello, your nextStep flow is: ${nextStep.flow}",
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
                        say: {
                            message: "See you next time",
                        },
                        follow: {
                            nextCoord: { flow: "exit", stepId: 1 },
                            fallbackCoord: { flow: "fallback", stepId: 1 },
                        },
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: false,
                    },
                ],
            },
            { message: "Let's go roboto" }
        );

        const lastStep = sessionAndSay.session.stacktrace[0] as Step;
        expect(lastStep.say).toEqual({ message: "Hello, your nextStep flow is: basic" });
        expect(sessionAndSay.session.checkpoint).toEqual({ stepId: 1, flow: "basic" });
        expect(sessionAndSay.session.nextStep).toEqual({ stepId: 2, flow: "basic" });
        expect(sessionAndSay.say.message).toEqual("Hello, your nextStep flow is: basic");
    });
    test("Should handle recursivity and flow switch if step has waitForUserInput set to false and follow coord has a different flow than current flow", async () => {
        const newSession = await sessionBuilder({ ...session, nextStep: { stepId: 2, flow: "hello" }, flow: "hello" });
        const sessionAndSay = await stepRunner(newSession, fileReader(FLOWS(), "hello"), {
            message: "Let's go roboto",
        });

        expect(sessionAndSay.session.checkpoint).toEqual({ stepId: 1, flow: "bye" });
        expect(sessionAndSay.session.nextStep).toEqual({ stepId: 1, flow: "bye" });
        expect(sessionAndSay.session.stacktrace.length).toEqual(2);
        expect(sessionAndSay.say.message).toEqual("Bye");
    });
    test("Should fallback if intent doesn't correspond to an existing flow", async () => {
        const newSession = await sessionBuilder({ ...session, nextStep: { stepId: 1, flow: "mock" }, flow: "hello" });
        jest.spyOn(NLU, "findIntent").mockReturnValueOnce(Promise.resolve({ name: "toto", info: {} }));
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

        expect(sessionAndSay.session.nextStep).toEqual({ stepId: 1, flow: "mocker" });
        expect(sessionAndSay.say.message).toEqual("Hu ho");
    });
});
