import { param, ValidationChain } from "express-validator";

export function mongoIdParam(): ValidationChain[] {
    return [param("id").exists().isMongoId()];
}
