import { updateSession } from "./sessionManager";
import { fileReader } from "./fileManager";
import logger, { BotError } from "../console/logger";
import { Flow, Say, Session, SessionStatus, Step } from "../types";
import { findIntent } from "./nlu";

export const FLOWS = () => {
    /* istanbul ignore next */
    if (process.env.NODE_ENV !== "test") {
        return process.env.FLOWSFOLDER ?? "./flows";
    } else {
        return "./src/tests/mockFlows";
    }
};

export const MAPPING = () => {
    /* istanbul ignore next */
    if (process.env.NODE_ENV !== "test") {
        return process.env.CONFIGFOLDER ?? "./config";
    } else {
        return "./src/tests/mockConfig";
    }
};

export function stepFinder(flow: Flow, pointer: { flow: string; id?: number }): Step {
    const step = flow.steps.find((el: Step) => el.id === (pointer.id ?? flow.startingId));

    if (!step) {
        // SHOULD NEVER HAPPEN if flow are correctly built and check
        throw new Error("Cannot find corresponding step");
    }

    return step;
}

function getDeepValue(session: Session, path: string): string {
    try {
        const keyChain = path.split(".");
        let data = session;
        for (const key of keyChain) {
            data = Reflect.get(data, key);
        }

        return data && typeof data !== "object" ? data : "Hu Ho";
    } catch (error) {
        logger.error(new BotError(error, { source: getDeepValue.name, code: 500, customMessage: error.message }));

        return "Hu Ho";
    }
}

export async function stepRunner(session: Session, flow: Flow, userSay: Say): Promise<Session> {
    const step = stepFinder(flow, session.nextStep);

    if (step.say && step.say.message) {
        // detect variables in bot message
        const match = step.say.message.match(/\${([\w.]*)}/m);
        if (match) {
            // Assign value to bot message
            step.say.message = step.say.message.replace(match[0], getDeepValue(session, match[1]));
        }
    }

    switch (step.action) {
        case "endSession":
            session.status = SessionStatus.CLOSED;
            session.nextStep = step.follow.nextCoord;

            break;

        case "targetFlow": {
            // Decide which flow to follow by looking at user intent from nlu server
            const foundIntent = await findIntent(userSay.message);
            const flow = Object.entries(MAPPING()).reduce((acc, [flow, intents]) => {
                if (Array.isArray(intents) && intents.includes(foundIntent)) {
                    acc = flow;
                }

                return acc;
            }, "");
            session.nextStep = flow ? { flow, id: step.follow.nextCoord.id } : step.follow.fallbackCoord;
            break;
        }

        case "saveSessionVariables":
            if (step.args) {
                for (const [key, value] of Object.entries(step.args)) {
                    Reflect.set(session.variables, key, value);
                }
            }
            session.nextStep = step.follow.nextCoord;
            break;

        case "saveSessionVariablesWithUserInput":
            if (step.args) {
                Reflect.set(session.variables, Object.keys(step.args)[0], userSay.message);
            }
            session.nextStep = step.follow.nextCoord;

            break;

        default:
            // No known action in current step => set nextStep
            session.nextStep = step.follow.nextCoord;
            break;
    }

    // Add current step to stacktrace
    session.stacktrace.push(step);

    // This is the only place where message should be saved
    if (step.say && step.say.message) {
        session.history.push({ message: step.say.message });
    }

    if (step.checkpoint) {
        session.checkpoint = { flow: step.flow, id: step.id };
    }

    // Update session with new value after each step
    session.flow = session.nextStep.flow;
    await updateSession(session);

    if (!step.waitForUserInput) {
        const formattedFlowName = flow.name.replace(" ", "_");
        if (session.nextStep.flow !== formattedFlowName) {
            // Load new json corresponding to new flow
            flow = fileReader(session.nextStep.flow);
            session.flow = formattedFlowName;
        }

        return await stepRunner(session, flow, userSay);
    }

    return session;
}
