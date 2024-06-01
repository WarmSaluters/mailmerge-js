import axios, { AxiosError } from "axios";

const OLLAMA_SERVER = "http://localhost:11434/api/chat"

export class OllamaClient {

    async requestLLM(messages: { role: string, content: string }[], options?: { model: string }) {
        try {
            const response = await axios.post(OLLAMA_SERVER, {
                model: options?.model || "llama3",
                messages: messages,
                stream: false
            })

            if (response.data.error) {
                throw new Error(response.data.error);
            }

            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                if (error.response?.data?.error) {
                    throw new OllamaMissingModelError(error.response.data.error);
                }
                if (error.code === "ECONNREFUSED") {
                    throw new OllamaNotFoundError("Ollama not found");
                }
            }
            throw new Error("Unexpected error: " + error);
        }
    }
}


export class OllamaMissingModelError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "OllamaMissingModelError";
    }
}

export class OllamaNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "OllamaNotFoundError";
    }
}

