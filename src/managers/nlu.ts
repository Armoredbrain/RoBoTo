import axios, { AxiosResponse } from "axios";
import { NLUDomain, NluModel, CallError } from "../types";
import { Document as YamlDocument } from "yaml";
import logger from "../console/logger";

export async function connectToNlu(): Promise<void> {
    try {
        await axios({
            method: "GET",
            url: `${process.env.NLU_SERVER_URL}/?token=${process.env.NLU_SECRET}`,
            headers: {
                Accept: "application/json",
            },
        });
        logger.info(`connected to NLU server`);
    } catch (error) {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        return await connectToNlu();
    }
}

export async function findIntent(message: string): Promise<{ name: string; info: Record<string, unknown> }> {
    const response: AxiosResponse = await axios({
        method: "POST",
        url: `${process.env.NLU_SERVER_URL}/model/parse?token=${process.env.NLU_SECRET}`,
        headers: {
            "Content-Type": "application/json",
        },
        data: {
            text: message,
        },
    });

    return { name: response.data.intent.name, info: response.data };
}

// unused for now, need change in NLU server to work correctly, see commit #785647a411 on NLU_server
// Once change done, apply to other axios call to nlu server
export async function getAllDomainInfo(): Promise<NLUDomain> {
    const res = await axios({
        method: "GET",
        url: `${process.env.NLU_SERVER_URL}/domain?token=${process.env.NLU_SECRET}`,
        headers: {
            Accept: "application/json",
        },
    });

    return res.data;
}

export async function mockCall(args: Record<string, unknown>): Promise<void | CallError<{ message: string }>> {
    try {
        await axios({
            method: "post",
            url: `${process.env.NLU_SERVER}/`,
            data: args,
        });
    } catch (error) {
        return new CallError<{ message: "Something went wrong during diagnostic url fetching" }>(
            "fetchDiagUrl",
            error.message ?? error.response.statusText,
            { message: "Something went wrong during diagnostic url fetching" }
        );
    }
}

export async function trainNewModel(model: NluModel): Promise<void> {
    const yamlModel = new YamlDocument();
    // TODO: find a way to properly convert NluModel into yaml Node interface instead of this shenaningan
    Reflect.set(yamlModel, "contents", model);
    const res = await axios({
        method: "POST",
        url: `${process.env.NLU_SERVER_URL}/model/train?token=${process.env.NLU_SECRET}`,
        headers: {
            Accept: "application/yaml",
        },
        data: yamlModel.toString(),
    });

    return res.data;
}
