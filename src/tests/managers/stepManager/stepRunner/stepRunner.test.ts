import { sessionBuilder } from "../../../../managers/sessionManager";
import { stepRunner } from "../../../../managers/stepManager";
import { connect, clear, close } from "../../../helper";
import { Flow, Session, SessionStatus, Step } from "../../../../types";

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
                id: 1,
                say: {
                    message: "Hello, your session flow is ${flow}",
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
                say: {
                    message: "See you next time ${echo.something}",
                },
                follow: {
                    nextCoord: { flow: "basic", id: 1 },
                    fallbackCoord: { flow: "fallback", id: 1 },
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
        nextStep: { flow: "basic", id: 1 },
        status: SessionStatus.AVAILABLE,
        variables: {},
        history: [],
    };
});

describe("stepRunner", () => {
    test("Should handle step say and replace special wrapper with value from session", async () => {
        const newSession = await sessionBuilder(session);
        const updatedSession = await stepRunner(newSession, flow, { message: "Let's go roboto" });
        const lastStep = updatedSession.stacktrace[0] as Step;
        expect(lastStep.say).toEqual({ message: `Hello, your session flow is basic` });
        expect(updatedSession.checkpoint).toEqual({ id: 1, flow: "basic" });
        expect(updatedSession.nextStep).toEqual({ id: 2, flow: "basic" });
    });
    test("Should handle step say and replace special wrapper with Hu ho if absent from session", async () => {
        const newSession = await sessionBuilder({ ...session, nextStep: { flow: "basic", id: 2 } });
        const updatedSession = await stepRunner(newSession, flow, { message: "Let's go roboto" });
        const lastStep = updatedSession.stacktrace[0] as Step;
        expect(lastStep.say).toEqual({ message: `See you next time Hu Ho` });
        expect(updatedSession.checkpoint).toEqual({ id: 1, flow: "basic" });
        expect(updatedSession.nextStep).toEqual({ id: 2, flow: "basic" });
    });
    test("Should handle step say and replace special wrapper with an empty string path point to a key in a string", async () => {
        const newSession = await sessionBuilder(session);
        const updatedSession = await stepRunner(
            newSession,
            {
                ...flow,
                steps: [
                    {
                        id: 1,
                        say: {
                            message: "Hello, I your nextStep flow is: '${nextStep.flow}'",
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
                        say: {
                            message: "See you next time",
                        },
                        follow: {
                            nextCoord: { flow: "exit", id: 1 },
                            fallbackCoord: { flow: "fallback", id: 1 },
                        },
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: false,
                    },
                ],
            },
            { message: "Let's go roboto" }
        );

        const lastStep = updatedSession.stacktrace[0] as Step;
        expect(lastStep.say).toEqual({ message: "Hello, I your nextStep flow is: 'basic'" });
        expect(updatedSession.checkpoint).toEqual({ id: 1, flow: "basic" });
        expect(updatedSession.nextStep).toEqual({ id: 2, flow: "basic" });
    });
    // test("Should push an error into stacktrace if encountering an error", async () => {
    //     // TODO: handle test case
    // });
    // test("Should handle recursivity and flow switch if step has waitForUserInput set to false and follow coord has a different flow than current flow", async () => {
    //     const newSession = await sessionBuilder({ ...session, nextStep: { id: 2, flow: "basic" } });
    //     const updatedSession = await stepRunner(newSession, flow, { message: "Let's go roboto" });

    //     expect(updatedSession.checkpoint).toEqual({ id: 1, flow: "exit" });
    //     expect(updatedSession.nextStep).toEqual({ id: 2, flow: "exit" });
    //     expect(updatedSession.stacktrace.length).toEqual(2);
    // });
});
