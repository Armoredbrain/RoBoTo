import { Step, SessionStatus, MessageType, ServiceName } from "@neomanis/neo-types";
import * as sessionManager from "../../../../managers/sessionManager";
import { stepRunner } from "../../../../managers/stepManager";
import * as calls from "../../../../managers/calls";

jest.spyOn(sessionManager, "updateSession").mockImplementation(async () => Promise.resolve());

describe("changeSayMessage", () => {
    test("should change say message with orchestratorMessage value in variable object", async () => {
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
            variables: {
                orchestratorMessage: "Here is a custom say message",
            },
            history: [],
            entity: { id: 1, itsmCode: "IT1" },
            platform: ServiceName.NEO_HELPER,
        };

        const spySendMessage = jest.spyOn(calls, "sendMessage").mockResolvedValueOnce(Promise.resolve());

        const updatedSession = await stepRunner(
            session,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "changeSayMessage",
                        say: {
                            message: "This message will be overwritten",
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
                sequencePosition: 0,
            },
            "jwtoken"
        );
        const lastStep = updatedSession.stacktrace.at(-1) as Step;
        expect(spySendMessage).toHaveBeenCalledWith(
            {
                content: "Here is a custom say message",
                createdAt: expect.any(String),
                isPrivate: false,
                options: [],
                recipients: [77],
                sender: 55,
                sequencePosition: 1,
                type: MessageType.MESSAGE,
            },
            55,
            "jwtoken"
        );
        expect(lastStep.say?.message).toEqual("Here is a custom say message");
    });
    test("should keep original say message if orchestratorMessage value is not in variable object", async () => {
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

        const spySendMessage = jest.spyOn(calls, "sendMessage").mockResolvedValueOnce(Promise.resolve());

        const updatedSession = await stepRunner(
            session,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "changeSayMessage",
                        say: {
                            message: "This message will NOT be overwritten",
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
                sequencePosition: 0,
            },
            "jwtoken"
        );
        const lastStep = updatedSession.stacktrace.at(-1) as Step;
        expect(spySendMessage).toHaveBeenCalledWith(
            {
                content: "This message will NOT be overwritten",
                createdAt: expect.any(String),
                isPrivate: false,
                options: [],
                recipients: [77],
                sender: 55,
                sequencePosition: 1,
                type: MessageType.MESSAGE,
            },
            55,
            "jwtoken"
        );
        expect(lastStep.say?.message).toEqual("This message will NOT be overwritten");
    });
});
