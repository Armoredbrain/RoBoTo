import { displayErrorTrace } from "../managers/tools";

describe("displayErrorTrace", () => {
    test("Should display error trace", async () => {
        const error = {
            stack: "hello\nbye\nworld",
        };

        expect(displayErrorTrace(error)).toEqual(["hello", "bye", "world"]);
    });
});
