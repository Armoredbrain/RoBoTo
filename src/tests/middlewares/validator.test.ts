import { mongoIdParam } from "../../middlewares/paramValidator";
import { validator } from "../../middlewares/validator";
import express, { Request, Response } from "express";
import request from "supertest";

describe("validator", () => {
    const app = express();
    app.use(express.json());
    app.get("/:id/:filename", mongoIdParam(), validator, (_req: Request, res: Response) => {
        res.status(200).end();
    });
    test("should chain validator and check them in validator", (done) => {
        request(app).get("/toto/tutu").expect(406, done);
    });
});
