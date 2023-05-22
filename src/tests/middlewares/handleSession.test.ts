import { checkSessionStatus, restoreSessionStatus } from "../../middlewares/handleSession";
import { Request, Response } from "express";
import { connect, close, clear } from "../helper";
import { SessionModel } from "../../entities/Session";
import { SessionStatus } from "../../types";

beforeAll(async () => {
    await connect();
});

afterEach(async () => {
    await clear();
});

afterAll(async () => {
    await close();
});

describe("checkSessionStatus", () => {
    test("should let request pass if session id param is undefined", async () => {
        const req: Partial<Request> = {
            headers: {},
            cookies: {},
            params: {},
        };
        const res: Partial<Response> = {
            locals: {},
        };
        const next = jest.fn();

        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);

        await checkSessionStatus(req as Request, res as Response, next);

        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });
    test("should let request pass if session is not busy or closed and change its status to busy", async () => {
        const newSession = await new SessionModel({
            checkpoint: { flow: "basic", id: 1 },
            flow: "basic",
            history: [],
            nextStep: { flow: "basic" },
            stacktrace: [],
            status: SessionStatus.AVAILABLE,
        }).save();

        const req: Partial<Request> = {
            headers: {},
            cookies: {},
            params: {
                sessionId: newSession.id,
            },
        };
        const res: Partial<Response> = {
            locals: {},
        };
        const next = jest.fn();

        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);

        await checkSessionStatus(req as Request, res as Response, next);

        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
        expect((await SessionModel.findOne({ _id: newSession.id }))?.status).toEqual(SessionStatus.BUSY);
    });
    test("should NOT let request pass if session is busy", async () => {
        const newSession = await new SessionModel({
            checkpoint: { flow: "basic", id: 1 },
            flow: "basic",
            history: [],
            nextStep: { flow: "basic" },
            stacktrace: [],
            status: SessionStatus.BUSY,
        }).save();

        const req: Partial<Request> = {
            headers: {},
            cookies: {},
            params: {
                sessionId: newSession.id,
            },
        };
        const res: Partial<Response> = {
            locals: {},
        };
        const next = jest.fn();

        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);

        await checkSessionStatus(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ code: 403, message: "Session is unavailable" });
        expect(next).not.toHaveBeenCalled();
    });
    test("should NOT let request pass if session is closed", async () => {
        const newSession = await new SessionModel({
            checkpoint: { flow: "basic", id: 1 },
            flow: "basic",
            history: [],
            nextStep: { flow: "basic" },
            stacktrace: [],
            status: SessionStatus.CLOSED,
        }).save();

        const req: Partial<Request> = {
            headers: {},
            cookies: {},
            params: {
                sessionId: newSession.id,
            },
        };
        const res: Partial<Response> = {
            locals: {},
        };
        const next = jest.fn();

        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);

        await checkSessionStatus(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ code: 403, message: "Session is unavailable" });
        expect(next).not.toHaveBeenCalled();
    });
});

describe("restoreSessionStatus", () => {
    test("should call next if session doesn't exists", async () => {
        const req: Partial<Request> = {
            headers: {},
            cookies: {},
            params: {},
        };
        const res: Partial<Response> = {
            locals: {},
        };
        const next = jest.fn();

        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);

        await restoreSessionStatus(req as Request, res as Response, next);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });
    test("should restore session status", async () => {
        const newSession = await new SessionModel({
            checkpoint: { flow: "basic", id: 1 },
            flow: "basic",
            history: [],
            nextStep: { flow: "basic" },
            stacktrace: [],
            status: SessionStatus.BUSY,
        }).save();

        const req: Partial<Request> = {
            headers: {},
            cookies: {},
            params: {
                sessionId: newSession.id,
            },
        };
        const res: Partial<Response> = {
            locals: {},
        };
        const next = jest.fn();

        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);

        await restoreSessionStatus(req as Request, res as Response, next);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
        expect((await SessionModel.findOne({ _id: newSession.id }))?.status).toEqual(SessionStatus.AVAILABLE);
    });
});
