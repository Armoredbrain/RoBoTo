import logger from "../../../console/logger";
import { getDeepValue } from "../../../managers/stepManager";
import { SessionStatus } from "../../../types";

describe("getDeepValue", () => {
    test("should get value in session using object path", () => {
        const value = getDeepValue(
            {
                stacktrace: [],
                flow: "basic",
                nextStep: { flow: "basic", id: 1 },
                status: SessionStatus.AVAILABLE,
                variables: { echo: { toto: "is happy" } },
                history: [],
                checkpoint: { id: 1, flow: "basic" },
                id: "aaaaaaaaaaaaaaaaaaaaaaaa",
            },
            "variables.echo.toto"
        );
        expect(value).toEqual("is happy");
    });
    test("should return Hu Ho if path doesn't correspond to current session state", () => {
        logger.error = jest.fn();
        const value = getDeepValue(
            {
                stacktrace: [],
                flow: "basic",
                nextStep: { flow: "basic", id: 1 },
                status: SessionStatus.AVAILABLE,
                variables: { echo: { toto: "is happy" } },
                history: [],
                checkpoint: { id: 1, flow: "basic" },
                id: "aaaaaaaaaaaaaaaaaaaaaaaa",
            },
            "variables.foo.bar"
        );
        expect(value).toEqual("Hu Ho");
        expect(logger.error).toHaveBeenCalledWith(
            expect.objectContaining({
                code: 500,
                information: { name: "TypeError" },
                isAxiosError: false,
                message: "Reflect.get called on non-object",
                result: { code: 500, message: "Reflect.get called on non-object" },
                source: "getDeepValue",
            })
        );
    });
});
