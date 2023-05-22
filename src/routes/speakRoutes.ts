import { NextFunction, Router, Response, Request } from "express";
import { speak } from "../controllers/speak";
import { speakPayload } from "../middlewares/payloadValidator";
import { validator } from "../middlewares/validator";
import { checkSessionStatus, restoreSessionStatus } from "../middlewares/handleSession";
import { mongoIdParam } from "../middlewares/paramValidator";

export const speakRouter = Router();

speakRouter.post(
    "/:sessionId?",
    (req: Request, res: Response, next: NextFunction) => {
        checkSessionStatus(req, res, next);
    },
    mongoIdParam(),
    speakPayload(),
    validator,
    speak,
    (req: Request, res: Response, next: NextFunction) => {
        restoreSessionStatus(req, res, next);
    }
);
