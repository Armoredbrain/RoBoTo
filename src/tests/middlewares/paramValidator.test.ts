import { mongoIdParam } from "../../middlewares/paramValidator";
import { validator } from "../../middlewares/validator";
import express, { Request, Response } from "express";
import request from "supertest";

describe("mongoIdParam", () => {
    const app = express();
    app.use(express.json());
    app.get("/:id", mongoIdParam(), validator, (_req: Request, res: Response) => {
        res.status(200).end();
    });
    test("should let request pass", (done) => {
        request(app).get("/aaaaaaaaaaaaaaaaaaaaaaaa").expect(200, done);
    });
    test("should NOT let request pass if param is not a mongo id", (done) => {
        request(app).get("/toto").expect(406, done);
    });
});
