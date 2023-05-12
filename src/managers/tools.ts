import { Request } from "express";

export function displayErrorTrace(error: { stack: string }): string[] {
    return error.stack.split("\n");
}

export function tokenExtractor(req: Request): string {
    if (req.headers.authorization) {
        return req.headers.authorization.split(" ")[1] as string;
    } else {
        return req.cookies.neoToken as string;
    }
}
