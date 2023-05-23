import { Router } from "express";
import { speak } from "../controllers/speak";
import { speakPayload } from "../middlewares/payloadValidator";
import { validator } from "../middlewares/validator";
import { mongoIdParam } from "../middlewares/paramValidator";

export const speakRouter = Router();

speakRouter.post("/:sessionId?", mongoIdParam(), speakPayload(), validator, speak);
