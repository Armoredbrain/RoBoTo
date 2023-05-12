import { speakPayload } from "../../middlewares/payloadValidator";
import { validator } from "../../middlewares/validator";
import express, { Request, Response } from "express";
import request from "supertest";

describe("speakPayload", () => {
    const app = express();
    app.use(express.json());
    app.post("/", speakPayload(), validator, (_req: Request, res: Response) => {
        res.status(200).end();
    });
    test("should let request pass", (done) => {
        request(app)
            .post("/")
            .send({
                session: {
                    id: "aaaaaaaaaaaaaaaaaaaaaaaa",
                },
                say: {
                    message: "toto is back",
                },
            })
            .expect(200, done);
    });
    test("should fail if body is malformed", (done) => {
        request(app)
            .post("/")
            .send({
                toto: "is back",
            })
            .expect(406, done);
    });
});
