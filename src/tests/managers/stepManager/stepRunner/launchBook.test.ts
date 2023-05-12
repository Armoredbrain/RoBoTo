import * as sessionManager from "../../../../managers/sessionManager";
import { mockAxios } from "../../../helper";
import { stepRunner } from "../../../../managers/stepManager";
import { CallError } from "../../../../managers/calls";
import { OrchestratorStep, Session } from "../../../../schemas/interfaces";
import { AxiosError } from "axios";
import { Step, SessionStatus, Status, Ticket, Resource, ServiceName, StepFollow } from "@neomanis/neo-types";

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

describe("launchBook", () => {
    test("should handle launchbook, analyse result, and choose nextStep accordingly", async () => {
        mockAxios
            .mockResolvedValueOnce(Promise.resolve({}))
            .mockResolvedValueOnce(
                Promise.resolve({ data: { books: [{ id: "aaaaaaaaaaaaaaaaaaaaaaaa", filename: "printer" }] } })
            )
            .mockResolvedValueOnce(
                Promise.resolve({ data: { diagnostics: [{ results: [{ Exit: { type: "solved" } }] }] } })
            );
        const updatedSession = await stepRunner(
            { ...session, variables: { ...session.variables, toto: "toto is back" }, ticket },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        flow: "printer",
                        action: "launchBook",
                        waitForUserInput: true,
                        checkpoint: false,
                        args: {
                            book: "printer",
                            toto: "",
                        },
                        follow: {} as StepFollow,
                        results: {
                            escalate: { flow: "basic", id: 7 },
                            confirmation: { flow: "basic", id: 3 },
                            solved: { flow: "basic", id: 5 },
                            error: { flow: "basic", id: 6 },
                            approval: { flow: "basic", id: 8 },
                        },
                    } as OrchestratorStep,
                ],
            },
            {
                message: "",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 5 });
    });
    test("should handle launchbook, analyse result, and choose nextStep accordingly and set orchestrator message", async () => {
        mockAxios
            .mockResolvedValueOnce(Promise.resolve({}))
            .mockResolvedValueOnce(
                Promise.resolve({ data: { books: [{ id: "aaaaaaaaaaaaaaaaaaaaaaaa", filename: "printer" }] } })
            )
            .mockResolvedValueOnce(Promise.resolve({ data: { value: "solved", message: "hello roboto" } }));
        const updatedSession = await stepRunner(
            { ...session, ticket },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        flow: "printer",
                        action: "launchBook",
                        waitForUserInput: true,
                        checkpoint: false,
                        args: {
                            book: "printer",
                        },
                        follow: {} as StepFollow,
                        results: {
                            escalate: { flow: "basic", id: 7 },
                            confirmation: { flow: "basic", id: 3 },
                            solved: { flow: "basic", id: 5 },
                            error: { flow: "basic", id: 6 },
                            approval: { flow: "basic", id: 8 },
                        },
                    } as OrchestratorStep,
                ],
            },
            {
                message: "",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 5 });
        expect(updatedSession.variables.orchestratorMessage).toEqual("hello roboto");
    });
    test("should handle error if book filename is not present in book list", async () => {
        mockAxios
            .mockResolvedValueOnce(Promise.resolve({}))
            .mockResolvedValueOnce(
                Promise.resolve({ data: { books: [{ id: "bbbbbbbbbbbbbbbbbbbbbbbb", filename: "file" }] } })
            );
        const updatedSession = await stepRunner(
            { ...session, ticket },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        flow: "printer",
                        action: "launchBook",
                        waitForUserInput: true,
                        checkpoint: false,
                        args: {
                            book: "printer",
                        },
                        follow: {} as StepFollow,
                        results: {
                            escalate: { flow: "basic", id: 7 },
                            confirmation: { flow: "basic", id: 3 },
                            solved: { flow: "basic", id: 5 },
                            error: { flow: "basic", id: 6 },
                            approval: { flow: "basic", id: 8 },
                        },
                    } as OrchestratorStep,
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
    test("should handle error if fetch book fail", async () => {
        mockAxios.mockResolvedValueOnce(Promise.resolve({})).mockResolvedValueOnce(
            Promise.resolve({
                data: {
                    books: new CallError("fetchBooks", "Forbidden access", {
                        neoBotId: 55,
                    }),
                },
            })
        );
        const updatedSession = await stepRunner(
            { ...session, ticket },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        flow: "basic",
                        action: "launchBook",
                        waitForUserInput: true,
                        checkpoint: false,
                        args: {
                            book: "printer",
                        },
                        follow: {} as StepFollow,
                        results: {
                            escalate: { flow: "basic", id: 7 },
                            confirmation: { flow: "basic", id: 3 },
                            solved: { flow: "basic", id: 5 },
                            error: { flow: "basic", id: 6 },
                            approval: { flow: "basic", id: 8 },
                        },
                    } as OrchestratorStep,
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
    test("should handle launchbook, catch error, and choose nextStep accordingly after updating stacktrace", async () => {
        mockAxios
            .mockResolvedValueOnce(Promise.resolve({}))
            .mockResolvedValueOnce(
                Promise.resolve({ data: { books: [{ id: "aaaaaaaaaaaaaaaaaaaaaaaa", filename: "printer" }] } })
            )
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
                        action: "launchBook",
                        waitForUserInput: true,
                        checkpoint: false,
                        flow: "basic",
                        args: {
                            book: "printer",
                        },
                        follow: {} as StepFollow,
                        results: {
                            escalate: { flow: "basic", id: 7 },
                            confirmation: { flow: "basic", id: 3 },
                            solved: { flow: "basic", id: 5 },
                            error: { flow: "basic", id: 6 },
                            approval: { flow: "basic", id: 8 },
                        },
                    } as OrchestratorStep,
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
    test("should choose results.error as nextStep if no ticket or no diagnostics", async () => {
        const newSession = session;
        delete newSession.diagnostics;
        const updatedSession = await stepRunner(
            newSession,
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        flow: "basic",
                        args: {
                            book: "printer",
                        },
                        follow: {} as StepFollow,
                        action: "launchBook",
                        waitForUserInput: true,
                        checkpoint: false,
                        results: {
                            escalate: { flow: "basic", id: 7 },
                            confirmation: { flow: "basic", id: 3 },
                            solved: { flow: "basic", id: 5 },
                            error: { flow: "basic", id: 6 },
                            approval: { flow: "basic", id: 8 },
                        },
                    } as OrchestratorStep,
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
    test("should handle launchbook, analyse result, and choose nextStep accordingly and set orchestrator message for neo-helper web", async () => {
        mockAxios
            .mockResolvedValueOnce(Promise.resolve({}))
            .mockResolvedValueOnce(
                Promise.resolve({ data: { books: [{ id: "aaaaaaaaaaaaaaaaaaaaaaaa", filename: "printer" }] } })
            )
            .mockResolvedValueOnce(Promise.resolve({ data: [{ url: "localhost:8005" }] }))
            .mockResolvedValueOnce(Promise.resolve({ data: { value: "solved", message: "hello roboto" } }));
        const updatedSession = await stepRunner(
            { ...session, ticket, platform: ServiceName.NEO_HELPER_WEB },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "launchBook",
                        waitForUserInput: true,
                        checkpoint: false,
                        flow: "basic",
                        args: {
                            book: "printer",
                        },
                        follow: {} as StepFollow,
                        results: {
                            escalate: { flow: "basic", id: 7 },
                            confirmation: { flow: "basic", id: 3 },
                            solved: { flow: "basic", id: 5 },
                            error: { flow: "basic", id: 6 },
                            approval: { flow: "basic", id: 8 },
                        },
                    } as OrchestratorStep,
                ],
            },
            {
                message: "",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 5 });
        expect(updatedSession.variables.orchestratorMessage).toEqual("hello roboto");
    });
    test("should set error, and choose nextStep accordingly after updating stacktrace if unable to get a default diagnostic service for neohelper web entity", async () => {
        mockAxios
            .mockResolvedValueOnce(Promise.resolve({}))
            .mockResolvedValueOnce(
                Promise.resolve({ data: { books: [{ id: "aaaaaaaaaaaaaaaaaaaaaaaa", filename: "printer" }] } })
            )
            .mockRejectedValueOnce({
                isAxiosError: true,
                response: { statusText: "NOTFOUND", status: 404 },
            } as AxiosError);
        const updatedSession = await stepRunner(
            { ...session, ticket, platform: ServiceName.NEO_HELPER_WEB },
            {
                name: "basic",
                description: "",
                startingId: 1,
                steps: [
                    {
                        id: 1,
                        action: "launchBook",
                        flow: "basic",
                        args: {
                            book: "printer",
                        },
                        follow: {} as StepFollow,
                        waitForUserInput: true,
                        checkpoint: false,
                        results: {
                            escalate: { flow: "basic", id: 7 },
                            confirmation: { flow: "basic", id: 3 },
                            solved: { flow: "basic", id: 5 },
                            error: { flow: "basic", id: 6 },
                            approval: { flow: "basic", id: 8 },
                        },
                    } as OrchestratorStep,
                ],
            },
            {
                message: "",
                sequencePosition: 0,
            },
            "jwtoken"
        );
        expect(updatedSession.nextStep).toEqual({ flow: "basic", id: 6 });
        expect((updatedSession.stacktrace.at(-2) as CallError<unknown>).message).toEqual("NOTFOUND");
    });
});
