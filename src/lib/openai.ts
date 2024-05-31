import { OpenAI } from "openai";
import Config from "./config.js";

export const requestLLM = async (messages: { role: string, content: string }[], options?: {model: string}) => {
    const openai = new OpenAI({
        apiKey: Config.openaiAPIKey
    });
    const response = await openai.chat.completions.create({
        model: options?.model || "gpt-4o",
        // @ts-expect-error types definition wonkiness
        messages,
        response_format: { type: "json_object" },
    });
    return response.choices[0].message.content;
};
