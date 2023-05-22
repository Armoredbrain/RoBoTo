import { body, ValidationChain } from "express-validator";

export function speakPayload(): ValidationChain[] {
    return [body("say").exists().isObject(), body("say.message").exists().isString()];
}
