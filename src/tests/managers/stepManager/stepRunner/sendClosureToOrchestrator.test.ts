import * as sessionManager from "../../../../managers/sessionManager";
import { mockAxios } from "../../../helper";
import { stepRunner } from "../../../../managers/stepManager";
import { CallError } from "../../../../managers/calls";
import { Session } from "../../../../schemas/interfaces";
import { AxiosError } from "axios";
import { Step, SessionStatus, Status, StepFollow, Ticket, Resource, ServiceName } from "@neomanis/neo-types";

jest.mock("axios");
let ticket: Partial<Ticket>;
let session: Session;

beforeEach(() => {
    ticket = {
        uid: "GL1-2",
        name: "Ticket sans titre",
        content: "<p>Ticket sans contenu</p>",
        status: Status.Assigned,
        userRequester: [77],
        userAssignedTo: [55],
        userWatcher: [],
        type: 1,
        entityId: 1,
        resources: [] as Resource[],
    };
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
        diagnostics: {},
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

describe("sendClosureToOrchestrator", () => {
    test("should handle sendClosureToOrchestrator, analyse result, and choose nextStep accordingly", async () => {
        mockAxios
            .mockResolvedValueOnce(Promise.resolve({}))
            .mockResolvedValueOnce(Promise.resolve({ data: { value: "confirmation" } }));
        const updatedSession = await stepRunner(
            { ...session, ticket },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "sendClosureToOrchestrator",
                        flow: "basic",
                        follow: {} as StepFollow,
                        waitForUserInput: true,
                        checkpoint: false,
                        args: { accepted: true },
                        results: {
                            escalate: { flow: "basic", id: 7 },
                            confirmation: { flow: "basic", id: 3 },
                            solved: { flow: "basic", id: 5 },
                            error: { flow: "basic", id: 6 },
                            approval: { flow: "basic", id: 8 },
                        },
                    } as Step,
                ],
            },
            {
                message: "",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 3 });
    });
    test("should handle sendClosureToOrchestrator, catch error, and choose nextStep accordingly after updating stacktrace", async () => {
        mockAxios
            .mockResolvedValueOnce(Promise.resolve({}))
            .mockRejectedValueOnce({ isAxiosError: true, response: { statusText: "BAD REQUEST" } } as AxiosError);
        const updatedSession = await stepRunner(
            { ...session, ticket },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "sendClosureToOrchestrator",
                        waitForUserInput: true,
                        args: { accepted: true },
                        flow: "basic",
                        follow: {} as StepFollow,
                        checkpoint: false,
                        results: {
                            escalate: { flow: "basic", id: 7 },
                            confirmation: { flow: "basic", id: 3 },
                            solved: { flow: "basic", id: 5 },
                            error: { flow: "basic", id: 6 },
                            approval: { flow: "basic", id: 8 },
                        },
                    } as Step,
                ],
            },
            {
                message: "",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 6 });
        expect((updatedSession.stacktrace.at(-2) as CallError<unknown>).message).toEqual("BAD REQUEST");
    });
    test("should choose results.error as nextStep if no ticket", async () => {
        const updatedSession = await stepRunner(
            session,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "sendClosureToOrchestrator",
                        waitForUserInput: true,
                        checkpoint: false,
                        args: { accepted: true },
                        flow: "basic",
                        follow: {} as StepFollow,
                        results: {
                            escalate: { flow: "basic", id: 7 },
                            confirmation: { flow: "basic", id: 3 },
                            solved: { flow: "basic", id: 5 },
                            error: { flow: "basic", id: 6 },
                            approval: { flow: "basic", id: 8 },
                        },
                    } as Step,
                ],
            },
            {
                message: "",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 6 });
    });
    test("should choose results.error as nextStep if accepted is not a boolean", async () => {
        const updatedSession = await stepRunner(
            { ...session, ticket },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "sendClosureToOrchestrator",
                        waitForUserInput: true,
                        checkpoint: false,
                        args: { accepted: "maybe" },
                        flow: "basic",
                        follow: {} as StepFollow,
                        results: {
                            escalate: { flow: "basic", id: 7 },
                            confirmation: { flow: "basic", id: 3 },
                            solved: { flow: "basic", id: 5 },
                            error: { flow: "basic", id: 6 },
                            approval: { flow: "basic", id: 8 },
                        },
                    } as Step,
                ],
            },
            {
                message: "",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 6 });
    });
    test("should choose results.error as nextStep if no step args", async () => {
        const updatedSession = await stepRunner(
            { ...session, ticket },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "sendClosureToOrchestrator",
                        waitForUserInput: true,
                        checkpoint: false,
                        flow: "basic",
                        follow: {} as StepFollow,
                        results: {
                            escalate: { flow: "basic", id: 7 },
                            confirmation: { flow: "basic", id: 3 },
                            solved: { flow: "basic", id: 5 },
                            error: { flow: "basic", id: 6 },
                            approval: { flow: "basic", id: 8 },
                        },
                    } as Step,
                ],
            },
            {
                message: "",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 6 });
    });
});
