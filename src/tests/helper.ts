import axios, { AxiosStatic, AxiosResponse, AxiosError } from "axios";
import mongoose from "mongoose";
import MongoMemoryServer from "mongodb-memory-server-core";
import FS from "../wrapper/fs";
import { FLOWSFOLDER } from "../managers/flowManager";

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

const flows = [
    { name: "flowA", description: "helloworld", license: "public", label: "flowA label", startingId: 1 },
    { name: "flowB", description: "helloworld", license: "public", label: "flowB label", startingId: 1 },
    { name: "flowC", description: "helloworld", license: "public", label: "flowC label", startingId: 1 },
    { name: "flowD", description: "helloworld", license: "public", label: "flowD label", startingId: 1 },
    {
        name: "ticket reopening",
        label: "ticket reopening label",
        description: "",
        startingId: 1,
        license: "neomanis",
        steps: [
            {
                id: 1,
                flow: "ticket_reopening",
                checkpoint: true,
                waitForUserInput: false,
                say: { message: "Oh, je suis désolé d'apprendre que votre problème est toujours présent!" },
                follow: {
                    nextCoord: { flow: "ticket_reopening", id: 2 },
                    fallbackCoord: { flow: "ticket_reopening", id: 2 },
                },
            },
            {
                id: 2,
                flow: "ticket_reopening",
                checkpoint: true,
                waitForUserInput: true,
                action: "talkingToHuman",
                say: {
                    message:
                        "Si vous avez des informations complémentaires à communiquer, n'hésitez pas à me les indiquer dans le chat je les transmettrai au technicien en charge de votre ticket.",
                },
                follow: {
                    nextCoord: { flow: "ticket_reopening", id: 2 },
                    fallbackCoord: { flow: "ticket_reopening", id: 2 },
                },
            },
        ],
    },
    { name: "toto", startingId: 1, license: "public" },
];

// export async function seedMockFlows(): Promise<void> {
//     // delete folder
//     if (FS.existsSync(FLOWSFOLDER())) FS.rmSync(FLOWSFOLDER(), { recursive: true, force: true });

//     // create a new one
//     if (!FS.existsSync(FLOWSFOLDER())) FS.mkdirSync(FLOWSFOLDER());

//     for (const flow of flows) {
//         FS.writeFileSync(`${FLOWSFOLDER()}/${formatFilename(flow.name)}.json`, JSON.stringify(flow));
//     }

//     // write exception
//     FS.writeFileSync(`${FLOWSFOLDER()}/${formatFilename("wrongParsing")}.json`, "{");
//     await new FlowModel({ filename: formatFilename("wrongParsing") }).save();
//     FS.writeFileSync(
//         `${FLOWSFOLDER()}/README.md`,
//         "### HELLO ticket_reopening.json file in this folder is required as it is used as hard coded value in sessionController (line 10 or something)"
//     );
// }

// export function setNeobot() {
//     Object.assign(neobot, { uid: "neobot", neoId: 55, dn: "a-dn" });
// }
