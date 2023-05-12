import * as fileManager from "../../../managers/fileManager";
import { stepFinder } from "../../../managers/stepManager";
import { Flow } from "@neomanis/neo-types";

const flow: Flow = {
    name: "basic",
    description: "",
    startingId: 1,
    steps: [
        {
            id: 1,
            say: {
                message: "Hello",
            },
            follow: {
                nextCoord: { flow: "basic", id: 2 },
                fallbackCoord: { flow: "fallback", id: 1 },
            },
            flow: "basic",
            checkpoint: false,
            waitForUserInput: true,
        },
        {
            id: 2,
            say: {
                message: "Bye",
            },
            follow: {
                nextCoord: { flow: "basic", id: 1 },
                fallbackCoord: { flow: "fallback", id: 1 },
            },
            flow: "basic",
            checkpoint: false,
            waitForUserInput: true,
        },
    ],
};

describe("stepFinder", () => {
    test("Should return step correcponding to pointer value", async () => {
        const step = stepFinder(flow, { flow: "basic", id: 1 });
        expect(step).toEqual({
            id: 1,
            say: {
                message: "Hello",
            },
            follow: {
                nextCoord: { flow: "basic", id: 2 },
                fallbackCoord: { flow: "fallback", id: 1 },
            },
            flow: "basic",
            checkpoint: false,
            waitForUserInput: true,
        });
    });
    test("Should return a step using starting id from flow", async () => {
        const step = stepFinder(flow, { flow: "basic" });
        expect(step).toEqual({
            id: 1,
            say: {
                message: "Hello",
            },
            follow: {
                nextCoord: { flow: "basic", id: 2 },
                fallbackCoord: { flow: "fallback", id: 1 },
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
            fallbacks: [
                {
                    id: 1,
                    say: {
                        message: "Welcome to fallback from main flow",
                    },
                    follow: {
                        nextCoord: { flow: "basic", id: 2 },
                        fallbackCoord: { flow: "fallback", id: 1 },
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
            stepFinder(flow, { flow: "???", id: 37 });
        } catch (error) {
            expect(error.message).toEqual("Cannot find corresponding step");
        }
    });
});
