import { validationResult } from "express-validator";
import { Response, Request, NextFunction } from "express";

export function validator(req: Request, res: Response, next: NextFunction): void {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    res.status(406).json({ code: 406, errors: errors.array() });
}
