import { SessionStatus, StepCoord } from "@neomanis/neo-types";
import { FlowModel } from "../../../../entities/Flow";
import { stepRunner } from "../../../../managers/stepManager";
import { Session, Step } from "../../../../schemas/interfaces";
import { seedFlows } from "../../../../db/seeder";
import { clear, connect, close, seedMockFlows } from "../../../helper";

jest.mock("axios");

beforeAll(async () => {
    await connect();
});
let session: Session;
beforeEach(async () => {
    session = {
        id: "63bbcfc7d9ffe8ed5e61b23b",
        talkingToHuman: false,
        username: "toto",
        techName: "neobot",
        userNeoId: 77,
        neoBotId: 55,
        computerName: "wiserthanme",
        resourcesType: "PRINTER",
        stacktrace: [] as Step[],
        flow: "flowa",
        nextStep: { flow: "basic", id: 1 },
        status: SessionStatus.AVAILABLE,
        variables: {
            book: "printer",
        },
        history: [],
        entity: { id: 1, itsmCode: "IT1" },
        platform: "neo_helper",
        ticket: {
            uid: "111-2222-333",
        },
    };
    await seedFlows();
    await seedMockFlows();
});
afterEach(async () => {
    jest.clearAllMocks();
});
afterAll(async () => {
    await clear();
    await close();
});

describe("manualFlowGate", () => {
    test("should set next flow without NLU", async () => {
        const mongoFlow = await FlowModel.findOne({ filename: "flowb" });
        const currentSession = await stepRunner(
            session,
            {
                name: "flowa",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "manualFlowGate",
                        args: {},
                        follow: {
                            nextCoord: {} as StepCoord,
                            fallbackCoord: { flow: "fallback", id: 1 },
                        },
                        flow: "flowa",
                        checkpoint: false,
                        waitForUserInput: true,
                    },
                ],
            },
            {
                message: "",
                option: { label: "toto label", value: mongoFlow?.id },
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(currentSession.nextStep).toEqual({ flow: "flowb", id: 1 });
        expect(currentSession.ticket?.content).toEqual("toto label");
    });
    test("should fallback next flow without NLU if there is no corresponding flow", async () => {
        const currentSession = await stepRunner(
            session,
            {
                name: "flowa",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "manualFlowGate",
                        args: {},
                        follow: {
                            nextCoord: {} as StepCoord,
                            fallbackCoord: { flow: "fallback", id: 1 },
                        },
                        flow: "flowa",
                        checkpoint: false,
                        waitForUserInput: true,
                    },
                ],
            },
            {
                message: "",
                option: { label: "toto label", value: "aaaaaaaaaaaaaaaaaaaaaaaa" },
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(currentSession.nextStep).toEqual({ flow: "fallback", id: 1 });
        expect(currentSession.ticket?.content).toEqual("toto label");
    });
    test("should fallback if there is no option in user message", async () => {
        const currentSession = await stepRunner(
            session,
            {
                name: "flowa",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "manualFlowGate",
                        args: {},
                        follow: {
                            nextCoord: {} as StepCoord,
                            fallbackCoord: { flow: "fallback", id: 1 },
                        },
                        flow: "flowa",
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
        expect(currentSession.nextStep).toEqual({ flow: "fallback", id: 1 });
    });
});
