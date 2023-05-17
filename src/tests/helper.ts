import axios, { AxiosStatic, AxiosResponse, AxiosError } from "axios";
import mongoose from "mongoose";
import MongoMemoryServer from "mongodb-memory-server-core";
// import FS from "../wrapper/fs";
// import { FLOWS } from "../managers/stepManager";

let mongod: MongoMemoryServer;

export async function connect(): Promise<void> {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    await mongoose.connect(uri);
}

export async function close(): Promise<void> {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
}

export async function clear(): Promise<void> {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
}

interface AxiosMock extends AxiosStatic {
    mockResolvedValue: (promise: Promise<Partial<AxiosResponse>>) => void;
    mockRejectedValue: (error: Partial<AxiosError>) => void;
    mockResolvedValueOnce: (promise: Promise<Partial<AxiosResponse>>) => this;
    mockRejectedValueOnce: (error: Partial<AxiosError>) => this;
}

export const mockAxios = axios as AxiosMock;

// const flows = [
//     { name: "flowA", description: "helloworld", startingId: 1 },
//     { name: "flowB", description: "helloworld", startingId: 1 },
//     { name: "flowC", description: "helloworld", startingId: 1 },
//     { name: "flowD", description: "helloworld", startingId: 1 },
//     {
//         name: "hello",
//         description: "",
//         startingId: 1,
//         steps: [
//             {
//                 id: 1,
//                 flow: "hello",
//                 checkpoint: true,
//                 waitForUserInput: false,
//                 say: { message: "Hello user" },
//                 follow: {
//                     nextCoord: { flow: "hello", id: 2 },
//                     fallbackCoord: { flow: "hello", id: 2 },
//                 },
//             },
//             {
//                 id: 2,
//                 flow: "hello",
//                 checkpoint: true,
//                 waitForUserInput: true,
//                 action: "saveUserPreference",
//                 say: {
//                     message: "How do you do?",
//                 },
//                 follow: {
//                     nextCoord: { flow: "hello", id: 2 },
//                     fallbackCoord: { flow: "hello", id: 2 },
//                 },
//             },
//         ],
//     },
//     { name: "toto", startingId: 1 },
// ];

// export async function seedMockFlows(): Promise<void> {
//     // delete folder
//     if (FS.existsSync(FLOWS())) FS.rmSync(FLOWS(), { recursive: true, force: true });

//     // create a new one
//     if (!FS.existsSync(FLOWS())) FS.mkdirSync(FLOWS());

//     for (const flow of flows) {
//         FS.writeFileSync(`${FLOWS()}/${formatFilename(flow.name)}.json`, JSON.stringify(flow));
//     }

//     // write exception
//     FS.writeFileSync(`${FLOWS()}/${formatFilename("wrongParsing")}.json`, "{");
//     await new FlowModel({ filename: formatFilename("wrongParsing") }).save();
//     FS.writeFileSync(
//         `${FLOWS()}/README.md`,
//         "### HELLO ticket_reopening.json file in this folder is required as it is used as hard coded value in sessionController (line 10 or something)"
//     );
// }

// export function setNeobot() {
//     Object.assign(neobot, { uid: "neobot", neoId: 55, dn: "a-dn" });
// }
