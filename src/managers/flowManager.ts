import { findIntent } from "./nlu";
import { Step, StepCoord } from "../types";

export const FLOWSFOLDER = () => {
    /* istanbul ignore next */
    if (process.env.NODE_ENV !== "test") {
        return process.env.FLOWSFOLDER ?? "./flows";
    } else {
        return "./src/tests/mockFlows";
    }
};

export async function flowGate(message: string, currentStep: Step): Promise<StepCoord> {
    const foundIntent = await findIntent(message);
    const flow = await getFlowByIntent(foundIntent.name);

    return flow ? { flow, id: currentStep.follow.nextCoord.id } : currentStep.follow.fallbackCoord;
}

export async function getFlowByIntent(intent: string): Promise<string | undefined> {
    // TODO: find a smart way to get flow by intent
    return "";
    // return Object.entries(MAPPING()).reduce((acc, [flow, intents]) => {
    //     if (Array.isArray(intents) && intents.includes(intent)) {
    //         acc = flow;
    //     }

    //     return acc;
    // }, "");
}
