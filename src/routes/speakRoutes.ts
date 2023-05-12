import { Router } from "express";
import { speak } from "../controllers/speak";
import { speakPayload } from "../middlewares/payloadValidator";
import { validator } from "../middlewares/validator";

export const speakRouter = Router();

speakRouter.post("/", speakPayload(), validator, speak);
