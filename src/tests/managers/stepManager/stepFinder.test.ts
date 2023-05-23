import * as fileManager from "../../../managers/fileManager";
import { stepFinder } from "../../../managers/stepManager";
import { Flow } from "../../../types";

const flow: Flow = {
    name: "basic",
    description: "",
    startingId: 1,
    steps: [
        {
            stepId: 1,
            say: {
                message: "Hello",
            },
            follow: {
                nextCoord: { flow: "basic", stepId: 2 },
                fallbackCoord: { flow: "fallback", stepId: 1 },
            },
            flow: "basic",
            checkpoint: false,
            waitForUserInput: true,
        },
        {
            stepId: 2,
            say: {
                message: "Bye",
            },
            follow: {
                nextCoord: { flow: "basic", stepId: 1 },
                fallbackCoord: { flow: "fallback", stepId: 1 },
            },
            flow: "basic",
            checkpoint: false,
            waitForUserInput: true,
        },
    ],
};

describe("stepFinder", () => {
    test("Should return step correcponding to pointer value", async () => {
        const step = stepFinder(flow, { flow: "basic", stepId: 1 });
        expect(step).toEqual({
            stepId: 1,
            say: {
                message: "Hello",
            },
            follow: {
                nextCoord: { flow: "basic", stepId: 2 },
                fallbackCoord: { flow: "fallback", stepId: 1 },
            },
            flow: "basic",
            checkpoint: false,
            waitForUserInput: true,
        });
    });
    test("Should return a step using starting id from flow", async () => {
        const step = stepFinder(flow, { flow: "basic" });
        expect(step).toEqual({
            stepId: 1,
            say: {
                message: "Hello",
            },
            follow: {
                nextCoord: { flow: "basic", stepId: 2 },
                fallbackCoord: { flow: "fallback", stepId: 1 },
            },
            flow: "basic",
            checkpoint: false,
            waitForUserInput: true,
        });
    });
    test("SHOULD NEVER HAPPEN if flow are correctly built and check !!", async () => {
        const mainFlow = {
            ...flow,
            filename: "basic",
            steps: [
                {
                    stepId: 1,
                    say: {
                        message: "Welcome to fallback from main flow",
                    },
                    follow: {
                        nextCoord: { flow: "basic", stepId: 2 },
                        fallbackCoord: { flow: "fallback", stepId: 1 },
                    },
                    flow: "basic",
                    checkpoint: false,
                    waitForUserInput: true,
                },
            ],
            name: "main",
        };
        jest.spyOn(fileManager, "fileReader").mockReturnValue(mainFlow);
        try {
            stepFinder(flow, { flow: "???", stepId: 37 });
        } catch (error) {
            expect(error.message).toEqual("Cannot find corresponding step");
        }
    });
});
