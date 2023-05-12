import { Schema, model } from "mongoose";
import { Session } from "../types";

export const SessionSchema = new Schema<Session>({
    checkpoint: Schema.Types.Mixed,
    flow: String,
    history: [{ type: Schema.Types.Mixed, default: [] }],
    nextStep: Schema.Types.Mixed,
    stacktrace: [{ type: Schema.Types.Mixed, default: [] }],
    status: { type: Number, default: 0 },
    variables: { type: Object, default: {} },
});

export const SessionModel = model<Session>("sessionModel", SessionSchema);
