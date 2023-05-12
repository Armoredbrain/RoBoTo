import { Step, SessionStatus, ServiceName } from "@neomanis/neo-types";
import * as sessionManager from "../../../../managers/sessionManager";
import { stepRunner } from "../../../../managers/stepManager";

const session = {
    id: "abc123",
    talkingToHuman: false,
    username: "toto",
    techName: "neobot",
    userNeoId: 77,
    neoBotId: 55,
    computerName: "wiserthanme",
    resourcesType: "PRINTER",
    stacktrace: [] as Step[],
    flow: "basic",
    nextStep: { flow: "basic", id: 1 },
    status: SessionStatus.AVAILABLE,
    variables: {},
    history: [],
    entity: { id: 1, itsmCode: "IT1" },
    platform: ServiceName.NEO_HELPER,
};

jest.spyOn(sessionManager, "updateSession").mockImplementation(async () => Promise.resolve());

describe("saveSessionVariables", () => {
    test("should change session talkingToHuman variable to true and return nextCoord as nextStep", async () => {
        const updatedSession = await stepRunner(
            session,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "talkingToHuman",
                        follow: {
                            nextCoord: { flow: "basic", id: 1 },
                            fallbackCoord: { flow: "fallback", id: 1 },
                        },
                        flow: "basic",
                        checkpoint: false,
                        waitForUserInput: true,
                    },
                ],
            },
            {
                message: "",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 1 });
        expect(updatedSession.talkingToHuman).toBeTruthy();
    });
});
