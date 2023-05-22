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
            id: 1,
            checkpoint: true,
            flow: "main",
            follow: { fallbackCoord: { flow: "main", id: 2 }, nextCoord: { flow: "main", id: 3 } },
            waitForUserInput: false,
            say: {
                message: "Hello my name is roboto, how do you do?",
            },
        },
        {
            id: 2,
            checkpoint: true,
            flow: "main",
            action: "checkMood",
            follow: { nextCoord: { flow: "main", id: 3 }, fallbackCoord: { flow: "main", id: 4 } },
            waitForUserInput: false,
        },
        {
            id: 3,
            checkpoint: true,
            flow: "main",
            follow: { fallbackCoord: { flow: "main", id: 1 }, nextCoord: { flow: "main", id: 1 } },
            waitForUserInput: true,
            say: {
                message: "Glad to hear it, what do you want to talk about",
            },
        },
        {
            id: 4,
            checkpoint: true,
            flow: "main",
            follow: { fallbackCoord: { flow: "main", id: 1 }, nextCoord: { flow: "main", id: 1 } },
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
                checkpoint: { flow: "main", id: 1 },
                flow: "main",
                history: [
                    {
                        message: "Hello my name is roboto, how do you do?",
                    },
                ],
                id: "aaaaaaaaaaaaaaaaaaaaaaaa",
                nextStep: { flow: "main", id: 3 },
                stacktrace: [],
                status: SessionStatus.BUSY,
                variables: {},
            })
        );
        jest.spyOn(fileManager, "fileReader").mockReturnValueOnce(flow);

        await speak(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ session: { id: expect.any(String), status: SessionStatus.BUSY } });
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
                }),
                stacktrace: [],
                status: SessionStatus.BUSY,
            }),
        ]);
    });
    test("should handle an existing session", async () => {
        const newSession = await new SessionModel({
            checkpoint: { flow: "main", id: 1 },
            flow: "main",
            history: [],
            nextStep: { flow: "main", id: 3 },
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

        const stepManagerSpy = jest.spyOn(stepManager, "stepRunner").mockReturnValueOnce(
            Promise.resolve({
                checkpoint: { flow: "main", id: 1 },
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
                nextStep: { flow: "main", id: 1 },
                stacktrace: [],
                status: SessionStatus.BUSY,
                variables: {},
            })
        );
        jest.spyOn(fileManager, "fileReader").mockReturnValueOnce(flow);

        await speak(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ session: { id: expect.any(String), status: SessionStatus.BUSY } });
        expect(stepManagerSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                flow: "main",
                history: [],
                nextStep: expect.objectContaining({ flow: "main" }),
                stacktrace: [],
                status: SessionStatus.BUSY,
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
                status: SessionStatus.BUSY,
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
            session: { id: expect.any(ObjectId), status: SessionStatus.BUSY },
            error: "Something unusual happen during step running",
        });
    });
});
