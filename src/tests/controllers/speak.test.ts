import { speak } from "../../controllers/speak";
import { Request, Response } from "express";
import { connect, close, clear } from "../helper";
import { SessionModel } from "../../entities/Session";
import { SessionStatus } from "../../types";
import * as stepManager from "../../managers/stepManager";
import * as fileManager from "../../managers/fileManager";
import { ObjectId } from "mongodb";
beforeAll(async () => {
    await connect();
});

afterEach(async () => {
    await clear();
});

afterAll(async () => {
    await close();
});

const flow = {
    description: "roboto greeting user",
    name: "main",
    startingId: 1,
    steps: [
        {
            stepId: 1,
            checkpoint: true,
            flow: "main",
            follow: { fallbackCoord: { flow: "main", stepId: 2 }, nextCoord: { flow: "main", stepId: 3 } },
            waitForUserInput: false,
            say: {
                message: "Hello my name is roboto, how do you do?",
            },
        },
        {
            stepId: 2,
            checkpoint: true,
            flow: "main",
            action: "checkMood",
            follow: { nextCoord: { flow: "main", stepId: 3 }, fallbackCoord: { flow: "main", stepId: 4 } },
            waitForUserInput: false,
        },
        {
            stepId: 3,
            checkpoint: true,
            flow: "main",
            follow: { fallbackCoord: { flow: "main", stepId: 1 }, nextCoord: { flow: "main", stepId: 1 } },
            waitForUserInput: true,
            say: {
                message: "Glad to hear it, what do you want to talk about",
            },
        },
        {
            stepId: 4,
            checkpoint: true,
            flow: "main",
            follow: { fallbackCoord: { flow: "main", stepId: 1 }, nextCoord: { flow: "main", stepId: 1 } },
            waitForUserInput: true,
            say: {
                message: "Let's see what we can do to cheer you up",
            },
        },
    ],
};

describe("speak", () => {
    test("should create a session if it doesn't exist", async () => {
        const req: Partial<Request> = {
            headers: {},
            cookies: {},
            params: {},
            body: {
                say: { message: "Hello roboto" },
            },
        };
        const res: Partial<Response> = {
            locals: {},
        };

        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);

        const stepManagerSpy = jest.spyOn(stepManager, "stepRunner").mockReturnValueOnce(
            Promise.resolve({
                session: {
                    checkpoint: { flow: "main", stepId: 1 },
                    flow: "main",
                    history: [
                        {
                            message: "Hello my name is roboto, how do you do?",
                        },
                    ],
                    id: "aaaaaaaaaaaaaaaaaaaaaaaa",
                    nextStep: { flow: "main", stepId: 3 },
                    stacktrace: [],
                    status: SessionStatus.BUSY,
                    variables: {},
                },
                say: { message: "Hello my name is roboto, how do you do?" },
            })
        );
        jest.spyOn(fileManager, "fileReader").mockReturnValueOnce(flow);

        await speak(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            session: { id: expect.any(String) },
            say: { message: "Hello my name is roboto, how do you do?" },
        });
        expect(stepManagerSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                flow: "main",
                history: [],
                nextStep: expect.objectContaining({ flow: "main" }),
                stacktrace: [],
                status: SessionStatus.BUSY,
            }),
            flow,
            { message: "Hello roboto" }
        );
        const dbContent = await SessionModel.find();
        expect(dbContent).toEqual([
            expect.objectContaining({
                flow: "main",
                history: [],
                nextStep: expect.objectContaining({
                    flow: "main",
                    stepId: 1,
                }),
                stacktrace: [],
                status: SessionStatus.AVAILABLE,
            }),
        ]);
    });
    test("should handle an existing session", async () => {
        const newSession = await new SessionModel({
            checkpoint: { flow: "main", stepId: 1 },
            flow: "main",
            history: [],
            nextStep: { flow: "main", stepId: 3 },
            stacktrace: [],
            status: SessionStatus.AVAILABLE,
            variables: {},
        }).save();
        const req: Partial<Request> = {
            headers: {},
            cookies: {},
            params: {
                sessionId: newSession.id,
            },
            body: {
                say: { message: "I'm fine actually" },
            },
        };
        const res: Partial<Response> = {
            locals: {},
        };

        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);

        const stepManagerSpy = jest.spyOn(stepManager, "stepRunner").mockReturnValueOnce(
            Promise.resolve({
                session: {
                    checkpoint: { flow: "main", stepId: 1 },
                    flow: "main",
                    history: [
                        {
                            message: "Hello my name is roboto, how do you do?",
                        },
                        {
                            message: "I'm fine actually",
                        },
                    ],
                    id: newSession.id,
                    nextStep: { flow: "main", stepId: 1 },
                    stacktrace: [],
                    status: SessionStatus.BUSY,
                    variables: {},
                },
                say: { message: "I'm fine actually" },
            })
        );
        jest.spyOn(fileManager, "fileReader").mockReturnValueOnce(flow);

        await speak(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            session: { id: expect.any(String) },
            say: { message: "I'm fine actually" },
        });
        expect(stepManagerSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                flow: "main",
                history: [],
                nextStep: expect.objectContaining({ flow: "main", stepId: 3 }),
                stacktrace: [],
                status: SessionStatus.AVAILABLE,
            }),
            flow,
            { message: "I'm fine actually" }
        );
        const dbContent = await SessionModel.find();
        expect(dbContent).toEqual([
            expect.objectContaining({
                id: newSession.id,
                flow: "main",
                history: [],
                nextStep: expect.objectContaining({
                    flow: "main",
                }),
                stacktrace: [],
                status: SessionStatus.AVAILABLE,
            }),
        ]);
    });
    test("should handle error and return a proper status and json payload", async () => {
        const req: Partial<Request> = {
            headers: {},
            cookies: {},
            params: {},
            body: {
                say: { message: "Hello roboto" },
            },
        };
        const res: Partial<Response> = {
            locals: {},
        };

        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);

        jest.spyOn(stepManager, "stepRunner").mockImplementationOnce(() => {
            throw new Error("Something unusual happen during step running");
        });
        jest.spyOn(fileManager, "fileReader").mockReturnValueOnce(flow);

        await speak(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            session: { id: expect.any(ObjectId) },
            error: "Something unusual happen during step running",
        });
    });
    test("should handle session having busy status", async () => {
        const newSession = await new SessionModel({
            checkpoint: { flow: "main", stepId: 1 },
            flow: "main",
            history: [],
            nextStep: { flow: "main", stepId: 3 },
            stacktrace: [],
            status: SessionStatus.BUSY,
            variables: {},
        }).save();
        const req: Partial<Request> = {
            headers: {},
            cookies: {},
            params: {
                sessionId: newSession.id,
            },
            body: {
                say: { message: "I'm fine actually" },
            },
        };
        const res: Partial<Response> = {
            locals: {},
        };

        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);

        await speak(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            session: { id: expect.any(String) },
            error: "Session is unavailable",
        });
    });
    test("should handle a critical error caused by database being disconnected during conversation and new session not being initialized", async () => {
        const req: Partial<Request> = {
            headers: {},
            cookies: {},
            params: {},
            body: {
                say: { message: "Hello roboto" },
            },
        };
        const res: Partial<Response> = {
            locals: {},
        };

        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);

        await close();

        await speak(req as Request, res as Response);

        await connect();
        await clear();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            session: undefined,
            error: expect.stringContaining("Client must be connected before running operations"),
        });
    });
});
