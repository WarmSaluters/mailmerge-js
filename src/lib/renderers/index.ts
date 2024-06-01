import { Renderer } from "./base.js";
import { MockRenderer } from "./mock.js";
import { OllamaRenderer } from "./ollama.js";
import { OpenAIChatRenderer } from "./openai.js";

export * from "./base.js";
export * from "./openai.js";
export * from "./mock.js";
export * from "./ollama.js";

type RendererInfo = {
    name: string,
    description: string,
    aliases?: string[]
}

type RendererTag = (
    'mock' |
    'openai/gpt-4o' |
    'openai/gpt-4-turbo' |
    'openai/gpt-3.5-turbo' |
    'openai/gpt-4-turbo-preview' |
    'ollama/llama3' |
    'ollama/llama3-70b'
);

export const supportedRenderers: Record<RendererTag, RendererInfo> = {
    "mock": {
        "name": "Mock",
        "description": "Mock renderer",
    },
    "openai/gpt-4o": {
        "name": "OpenAI GPT-4o",
        "description": "OpenAI GPT-4o renderer",
        "aliases": ["gpt-4o"]
    },
    "openai/gpt-4-turbo": {
        "name": "OpenAI GPT-4-Turbo",
        "description": "OpenAI GPT-4-Turbo renderer",
        "aliases": ["gpt-4-turbo"]
    },
    "openai/gpt-3.5-turbo": {
        "name": "OpenAI GPT-3.5-Turbo",
        "description": "OpenAI GPT-3.5-Turbo renderer",
        "aliases": ["gpt-3.5-turbo"]
    },
    "openai/gpt-4-turbo-preview": {
        "name": "OpenAI GPT-4-Turbo-Preview",
        "description": "OpenAI GPT-4-Turbo-Preview renderer",
        "aliases": ["gpt-4-turbo-preview"]
    },
    "ollama/llama3": {
        "name": "Llama3",
        "description": "Llama3 8B locally served by Ollama",
        "aliases": ["llama3", "llama3-8b"]
    },
    "ollama/llama3-70b": {
        "name": "Llama3-70b",
        "description": "Llama3 70B locally served by Ollama",
        "aliases": ["llama3-70b"]
    }
}

export const getRenderer = (tagOrAlias: string): Renderer => {
    const resolved = Object.keys(supportedRenderers).find(tag => tag === tagOrAlias || supportedRenderers[tag as RendererTag].aliases?.includes(tagOrAlias));
    if (!resolved) {
        throw new Error(`Renderer not found: ${tagOrAlias}`);
    }

    switch (resolved as RendererTag) {
        case "mock":
            return new MockRenderer();
        case "openai/gpt-4o":
            return new OpenAIChatRenderer('gpt-4o');
        case "openai/gpt-4-turbo":
            return new OpenAIChatRenderer('gpt-4-turbo');
        case "openai/gpt-3.5-turbo":
            return new OpenAIChatRenderer('gpt-3.5-turbo');
        case "ollama/llama3":
            return new OllamaRenderer('llama3');
        case "ollama/llama3-70b":
            return new OllamaRenderer('llama3-70b');
        default:
            throw new Error(`Renderer not found: ${tagOrAlias}`);
    }
}

