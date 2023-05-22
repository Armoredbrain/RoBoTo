import { FLOWS, fileReader } from "../../managers/fileManager";

describe("flowFileReader", () => {
    test("should return an object Flow", () => {
        const flow = fileReader(FLOWS(), "hello");
        expect(flow).toBeDefined();
    });
});
