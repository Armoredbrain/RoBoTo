import { getAllDomainInfo } from "../../managers/nlu";
import { mockAxios } from "../helper";

jest.mock("axios");

describe("getAllDomainInfo", () => {
    test("should return data from response", async () => {
        mockAxios.mockResolvedValueOnce(
            Promise.resolve({
                data: {
                    intents: [{ toto: {} }],
                },
            })
        );
        const data = await getAllDomainInfo();
        expect(data).toEqual({ intents: [{ toto: {} }] });
    });
});
