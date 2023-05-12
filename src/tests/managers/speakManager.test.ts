import { findIntent } from "../../managers/nlu";
import { mockAxios } from "../helper";

jest.mock("axios");

describe("findIntent", () => {
    test("Should return intent from nlu server", async () => {
        mockAxios.mockResolvedValueOnce(
            Promise.resolve({
                data: {
                    intent: {
                        name: "greeting",
                    },
                },
            })
        );

        const intent = await findIntent("hello bot");

        expect(intent).toEqual({ name: "greeting", info: { intent: { name: "greeting" } } });
    });
});
