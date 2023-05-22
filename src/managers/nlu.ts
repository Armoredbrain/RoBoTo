import axios, { AxiosResponse } from "axios";
import { NLUDomain, NluModel } from "../types";
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
        logger.info("connected to NLU server");
    } catch (error) {
        logger.info("retry to connect to NLU server");
        await new Promise((resolve) => setTimeout(resolve, 1000));

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

export async function trainNewModel(model: NluModel): Promise<void> {
    const yamlModel = new YamlDocument();
    Reflect.set(yamlModel, "contents", model);
    await axios({
        method: "POST",
        url: `${process.env.NLU_SERVER_URL}/model/train?token=${process.env.NLU_SECRET}`,
        headers: {
            Accept: "application/yaml",
        },
        data: yamlModel.toString(),
    });
}
