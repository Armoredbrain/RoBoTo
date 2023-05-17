export enum SessionStatus {
    AVAILABLE,
    BUSY,
    CLOSED,
}
export interface StepFollow {
    fallbackCoord: StepCoord;
    nextCoord: StepCoord;
}
export interface StepCoord {
    flow: string;
    id?: number;
}
export interface Step {
    action?: string;
    args?: Record<string, unknown>;
    checkpoint: boolean;
    flow: string;
    follow: StepFollow;
    id: number;
    type?: string;
    say?: Say;
    waitForUserInput: boolean;
}

export interface Flow {
    name: string;
    description: string;
    label?: string;
    startingId: number;
    steps: Step[];
    readonly license?: string;
}
export class CallError<T> {
    source: string;
    message: string;
    data: T;

    constructor(source: string, message: string, data: T) {
        this.source = source;
        this.message = message;
        this.data = data;
    }
}
export interface Session {
    checkpoint: StepCoord;
    flow: string;
    history: Say[];
    id: string;
    nextStep: StepCoord;
    stacktrace: (Step | CallError<unknown>)[];
    status: number;
    variables: Record<string, unknown>;
}

export interface Flow {
    name: string;
    description: string;
    startingId: number;
    steps: Step[];
}

export interface ApiGenericResponse {
    code: string;
    message: string;
}

export interface Say {
    message: string;
}

/**
 * this interface only reference part of nlu domain,
 * there is more but we only use intents key at the moment
 */
export interface NLUDomain {
    intents: Record<string, unknown>[];
}

export interface NluModel {
    // We do not use those for now
    pipeline: unknown[];
    policies: unknown[];
    intents: unknown[];
    entities: unknown[];
    slots: Record<string, unknown>;
    actions: unknown[];
    forms: Record<string, unknown>;
    e2e_actions: unknown[];
    session_config: { session_expiration_time: 60; carry_over_slots_to_new_session: true };

    // [
    //     {
    //         rule: "Say goodbye anytime the user says goodbye";
    //         steps: [{ intent: "goodbye" }, { action: "utter_goodbye" }];
    //     }
    // ];
    rules: { rule: string; steps: { intent?: string; action?: string }[] }[];

    // { utter_greet: [{ text: "Hey! How are you?" }]; utter_goodbye: [{ text: "Bye" }] };
    responses: Record<string, { text: string }[]>;

    // here code should make it easy for front to send an array of string and formatting it to fit nlu requirement
    //[{ intent: "greet"; examples: "- hey\n- hello\n" }, { intent: "goodbye"; examples: "- bye\n- goodbye\n" }];
    nlu: { intent: string; examples: string }[];

    // [
    //     {
    //         story: "happy path";
    //         steps: [{ intent: "greet" }, { action: "utter_greet" }, { intent: "goodbye" }, { action: "utter_goodbye" }];
    //     }
    // ];
    stories: { story: string; steps: { intent?: string; action: string }[] }[];
}
