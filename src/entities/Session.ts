import { Schema, model } from "mongoose";
import { Say, Session, Step, StepCoord, StepFollow } from "../types";

const SaySchema = new Schema<Say>({
    message: String,
});
const StepCoordSchema = new Schema<StepCoord>({
    flow: String,
    id: { type: Number, required: false },
});
const StepFollowSchema = new Schema<StepFollow>({
    fallbackCoord: StepCoordSchema,
    nextCoord: StepCoordSchema,
});
const StepSchema = new Schema<Step>({
    action: String,
    args: Schema.Types.Mixed,
    checkpoint: Boolean,
    flow: String,
    follow: StepFollowSchema,
    id: Number,
    type: String,
    say: SaySchema,
    waitForUserInput: Boolean,
});
export const SessionSchema = new Schema<Session>({
    checkpoint: StepCoordSchema,
    flow: String,
    history: [{ type: SaySchema, default: [] }],
    nextStep: StepCoordSchema,
    stacktrace: [{ type: StepSchema, default: [] }],
    status: { type: Number, default: 0 },
    variables: { type: Schema.Types.Mixed, default: {} },
});

export const SessionModel = model<Session>("sessionModel", SessionSchema);
