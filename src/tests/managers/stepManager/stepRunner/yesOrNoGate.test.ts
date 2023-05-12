import { Step, SessionStatus, ServiceName } from "@neomanis/neo-types";
import * as sessionManager from "../../../../managers/sessionManager";
import { stepRunner } from "../../../../managers/stepManager";
import { Session } from "../../../../schemas/interfaces";
import * as db from "../../../helper";

jest.mock("axios");
let session: Session;
beforeEach(() => {
    session = {
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
        variables: {
            book: "printer",
        },
        history: [],
        entity: { id: 1, itsmCode: "IT1" },
        platform: ServiceName.NEO_HELPER,
    };
});

jest.spyOn(sessionManager, "updateSession").mockImplementation(async () => Promise.resolve());

describe("yesOrNoGate", () => {
    test("should define next step according to user option choice => no: fallbackCoord, yes: nextCoord", async () => {
        db.mockAxios.mockResolvedValueOnce(Promise.resolve({ data: { intent: { name: "disagree" } } }));
        const updatedSession = await stepRunner(
            session,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "yesOrNoGate",
                        args: {
                            content: "I cannot open this file :",
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
            },
            {
                message: "",
                option: { label: "no", value: 2 },
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "fallback", id: 1 });
    });
    test("should define next step according to user message => disagree: fallbackCoord, agree: nextCoord", async () => {
        db.mockAxios.mockResolvedValueOnce(Promise.resolve({ data: { intent: { name: "agree" } } }));
        const updatedSession = await stepRunner(
            session,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "yesOrNoGate",
                        args: {
                            content: "I cannot open this file :",
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
            },
            {
                message: "oui bien sûr s'il vous plaît",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 1 });
    });
    test("should define next step to default fallback if nlu cannot understand user", async () => {
        db.mockAxios.mockResolvedValueOnce(Promise.resolve({ data: { intent: { name: "lool wtf ??" } } }));
        const updatedSession = await stepRunner(
            session,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "yesOrNoGate",
                        args: {
                            content: "I cannot open this file :",
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
            },
            {
                message: "Ja bitte.",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "fallback", id: 1 });
    });
});
