import { AxiosError } from "axios";
import logger from "../../console/logger";
import { connectToNlu, getAllDomainInfo } from "../../managers/nlu";
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

describe("connectToNlu", () => {
    test("should connect to nlu", async () => {
        mockAxios.mockResolvedValueOnce(Promise.resolve({}));
        logger.info = jest.fn();
        await connectToNlu();
        expect(logger.info).toHaveBeenCalledWith("connected to NLU server");
    });
    test("should fail to connect to nlu and retry after a delay", async () => {
        mockAxios
            .mockRejectedValueOnce({
                isAxiosError: true,
                response: { status: 401, statusText: "UNAUTHORIZED" },
            } as AxiosError)
            .mockResolvedValueOnce(Promise.resolve({}));
        logger.info = jest.fn();
        await connectToNlu();
        expect(logger.info).toHaveBeenNthCalledWith(1, "retry to connect to NLU server");
        expect(logger.info).toHaveBeenNthCalledWith(2, "connected to NLU server");
    });
});
