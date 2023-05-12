import * as nlu from "../../managers/nlu";
import { flowGate, getFlowByIntent, getAvailableFlows } from "../../managers/flowManager";
import { connect, clear, seedMockFlows, close } from "../helper";
import { readdirSync, readFileSync } from "fs";
import { FLOWSFOLDER } from "../../managers/flowManager";
import { mockAxios } from "../../tests/helper";

jest.mock("axios");
beforeAll(async () => {
    await connect();
});

beforeEach(async () => {
    await clear();
    await seedMockFlows();
    await seedFlows();
    mockAxios.mockResolvedValueOnce(Promise.resolve({ data: { entities: [{ id: 1, itsmCode: "IT1" }] } }));
    await setDefaultConfig();
});

afterAll(async () => {
    await close();
});

describe("flowGate", () => {
    test("Should redirect user to correct flow", async () => {
        jest.spyOn(nlu, "findIntent").mockImplementationOnce(async () => {
            return Promise.resolve({ name: "tutu", info: {} as Record<string, unknown> });
        });
        const nextStep = await flowGate(
            "I am toto",
            {
                id: 1,
                follow: { nextCoord: { id: 1 } as StepCoord, fallbackCoord: { flow: "fallback", id: 2 } },
                flow: "",
                checkpoint: false,
                waitForUserInput: false,
            },
            { platform: "neo_helper", entityId: 1, entityItsmCode: "IT1" } as Context
        );
        expect(nextStep).toEqual({ flow: "flowa", id: 1 });
    });
    test("Should redirect user to `fallbackCoord` if flow file doesn't exist ", async () => {
        jest.spyOn(nlu, "findIntent").mockImplementationOnce(async () => {
            return Promise.resolve({ name: "whoami", info: {} as Record<string, unknown> });
        });
        const nextStep = await flowGate(
            "I am toto",
            {
                id: 1,
                follow: { nextCoord: { flow: "main", id: 1 }, fallbackCoord: { flow: "fallback", id: 2 } },
                flow: "",
                checkpoint: false,
                waitForUserInput: false,
            },
            { platform: "neo_helper", entityId: 1, entityItsmCode: "IT1" } as Context
        );
        expect(nextStep).toEqual({ flow: "fallback", id: 2 });
    });
});

describe("createOneFlow", () => {
    test("Should create a new flow", async () => {
        const newFile = await createOneFlow({
            description: "coucou",
            name: "test",
            steps: [],
            startingId: 1,
        });
        expect(newFile).toEqual({
            description: "coucou",
            name: "test",
            filename: "test",
            steps: [],
            startingId: 1,
            license: "public",
            uid: expect.any(String),
        });
    });
    test("Should create a new flow", async () => {
        const newFile = await createOneFlow({
            name: "test",
        });
        expect(newFile).toEqual({
            description: "",
            name: "test",
            filename: "test",
            steps: [],
            startingId: 0,
            license: "public",
            uid: expect.any(String),
        });
    });
    test("Should throw as flow already exist", async () => {
        await createOneFlow({
            description: "coucou",
            name: "test",
            steps: [],
            startingId: 1,
        });
        await expect(async () => {
            await createOneFlow({
                description: "coucou",
                name: "test",
                steps: [],
                startingId: 1,
            });
        }).rejects.toThrow();
    });
});

describe("updateOneFlowHeader", () => {
    test("Should update the flow file and in database", async () => {
        await createOneFlow({ name: "flow to update", description: "premier flow" });
        const flowToUpdate = await FlowModel.findOne({ filename: "flow_to_update" });
        const fileNewFlow = await updateOneFlowHeader(
            { filename: flowToUpdate!.filename, id: flowToUpdate!.id },
            {
                name: "flow deux",
                description: "et hop le flow 2",
            }
        );
        expect(readdirSync(FLOWSFOLDER())).toContain("flow_deux.json");
        expect(fileNewFlow).toEqual({
            name: "flow deux",
            description: "et hop le flow 2",
            filename: "flow_deux",
            startingId: 0,
            steps: [],
            uid: expect.any(String),
            license: "public",
        });
    });
    test("Should throw error if flow not found", async () => {
        await expect(async () => {
            await updateOneFlowHeader(new FlowModel({ filename: "flowz" }), { name: "flowZZ" });
        }).rejects.toThrow();
    });
    test("Should throw error if new flow name already exist", async () => {
        await createOneFlow({ name: "flow to update" });
        await createOneFlow({ name: "existing flow" });
        await expect(async () => {
            await updateOneFlowHeader(new FlowModel({ filename: "flow_to_update" }), { name: "existing flow" });
        }).rejects.toThrow();
    });
});

describe("deleteOneFlow", () => {
    test("Should delete the flow in database", async () => {
        await createOneFlow({ name: "flowY" });
        let flowY = await FlowModel.findOne({ filename: "flowy" });
        await deleteOneFlow({ filename: flowY!.filename, id: flowY!.id });
        flowY = await FlowModel.findOne({ filename: "flowy" });
        expect(flowY).toEqual(null);
        expect(readdirSync(FLOWSFOLDER())).not.toContain("flowy");
    });
    test("Should throw error if flow not found", async () => {
        await expect(async () => {
            await deleteOneFlow({ filename: "unknown.json", id: "aaaaaaaaaaaaaaaaaaaaaaaa" });
        }).rejects.toThrow();
    });
});

describe("updateOneStep", () => {
    test("Should update a step", async () => {
        const flowDb = await FlowModel.findOne({ filename: "ticket_reopening" });
        const newSteps: Step[] = [
            {
                waitForUserInput: false,
                id: 6777,
                checkpoint: false,
                flow: "Sigma",

                follow: { fallbackCoord: { flow: "wesh" }, nextCoord: { flow: "alors" } },
            },
        ];
        const flow = await updateFlowSteps({ filename: flowDb!.filename, id: flowDb!.id }, newSteps);
        const updatedFlowFile: Flow = JSON.parse(readFileSync(`${FLOWSFOLDER()}/${flowDb?.filename}.json`, "utf-8"));
        expect(flow.steps).toEqual(newSteps);
        expect(updatedFlowFile).toEqual({
            description: "",
            name: "ticket reopening",
            startingId: 1,
            label: "ticket reopening label",
            license: "neomanis",
            steps: [
                {
                    checkpoint: false,
                    flow: "Sigma",
                    follow: {
                        fallbackCoord: {
                            flow: "wesh",
                        },
                        nextCoord: {
                            flow: "alors",
                        },
                    },
                    id: 6777,
                    waitForUserInput: false,
                },
            ],
        });
    });
});

describe("getFlowByIntent", () => {
    test("should throw error if no context exist", async () => {
        try {
            await getFlowByIntent("toto", {
                platform: ServiceName.NEO_HELPER,
                entityId: 2,
                entityItsmCode: "JIR4",
            } as Context);
            expect(true).toEqual(false);
        } catch (error) {
            expect(error).toBeDefined();
        }
    });
});

describe("getAvailableFlows", () => {
    test("should get available flow looking at context and entity", async () => {
        expect(await getAvailableFlows({ entityItsmCode: "IT1", entityId: 1, platform: "neo_helper" })).toEqual([
            "flowa",
            "flowb",
        ]);
    });
    test("should return undefined if context and entity don't match any mapping", async () => {
        try {
            await getAvailableFlows({ entityItsmCode: "toto", entityId: 7, platform: ServiceName.NEO_HELPER });
            expect(true).toEqual(false);
        } catch (error) {
            expect(error).toBeDefined();
        }
    });
});
