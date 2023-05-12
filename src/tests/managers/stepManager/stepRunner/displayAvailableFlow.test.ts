import { SessionStatus } from "@neomanis/neo-types";
import { setDefaultConfig } from "../../../../managers/configManager";
import { stepRunner } from "../../../../managers/stepManager";
import { Session, Step } from "../../../../schemas/interfaces";
import { seedFlows } from "../../../../db/seeder";
import { clear, connect, close, seedMockFlows, mockAxios } from "../../../helper";

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
    };
    await seedMockFlows();
    await seedFlows();
    mockAxios.mockResolvedValueOnce(Promise.resolve({ data: { entities: [{ id: 1, itsmCode: "IT1" }] } }));
    await setDefaultConfig();
});
afterEach(async () => {
    jest.clearAllMocks();
});
afterAll(async () => {
    await clear();
    await close();
});

describe("displayAvailableFlows", () => {
    test("should display as options all available flow to current context", async () => {
        const currentSession = await stepRunner(
            session,
            {
                name: "flowa",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "displayAllAvailableFlows",
                        args: {},
                        follow: {
                            nextCoord: { flow: "flowa", id: 1 },
                            fallbackCoord: { flow: "fallback", id: 1 },
                        },
                        say: {
                            message: "Hello user, choose one option",
                            options: [],
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
        expect(currentSession.stacktrace).toEqual([
            {
                action: "displayAllAvailableFlows",
                args: {},
                checkpoint: false,
                flow: "flowa",
                follow: {
                    fallbackCoord: {
                        flow: "fallback",
                        id: 1,
                    },
                    nextCoord: {
                        flow: "flowa",
                        id: 1,
                    },
                },
                id: 1,
                say: {
                    message: "Hello user, choose one option",
                    options: [
                        {
                            label: "flowA label",
                            value: expect.any(String),
                        },
                        {
                            label: "flowB label",
                            value: expect.any(String),
                        },
                    ],
                },
                waitForUserInput: true,
            },
        ]);
    });
});
