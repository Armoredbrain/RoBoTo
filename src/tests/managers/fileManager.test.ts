import { fileReader } from "../../managers/fileManager";

describe("fileReader", () => {
    test("Should return json file as object", () => {
        const flow = fileReader("toto");
        expect(flow).toEqual({ name: "toto", license: "public", startingId: 1 });
    });
});
