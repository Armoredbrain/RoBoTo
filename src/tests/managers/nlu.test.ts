import { AxiosError } from "axios";
import logger from "../../console/logger";
import { connectToNlu, getAllDomainInfo, trainNewModel } from "../../managers/nlu";
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

describe("trainNewModel", () => {
    test("should convert argument into YAML", async () => {
        const axiosMock = mockAxios.mockResolvedValueOnce(Promise.resolve({}));
        await trainNewModel({
            pipeline: [],
            policies: [],
            intents: [],
            entities: [],
            slots: {},
            actions: [],
            forms: {},
            e2e_actions: [],
            session_config: { session_expiration_time: 60, carry_over_slots_to_new_session: false },
            rules: [
                {
                    rule: "Say goodbye anytime the user says goodbye",
                    steps: [{ intent: "goodbye" }, { action: "utter_goodbye" }],
                },
            ],
            responses: { utter_greet: [{ text: "Hey! How are you?" }], utter_goodbye: [{ text: "Bye" }] },
            nlu: [
                { intent: "greet", examples: "- hey\n- hello\n" },
                { intent: "goodbye", examples: "- bye\n- goodbye\n" },
            ],
            stories: [
                {
                    story: "happy path",
                    steps: [
                        { intent: "greet", action: "utter_greet" },
                        { intent: "goodbye", action: "utter_goodbye" },
                    ],
                },
            ],
        });
        expect(axiosMock).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.any(String),
                headers: {
                    Accept: "application/yaml",
                },
                method: "POST",
                url: "http://172.17.0.2:5005/model/train?token=yesterdayIsTurfu",
            })
        );
    });
});
