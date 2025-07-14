//lib\llmRouter.ts
import { clients } from "@/lib/clients";
import { GoogleGenerativeAI } from "@google/generative-ai";

const { openai, anthropic, google, mistral } = clients;

type Provider = keyof typeof clients;

interface CallLLMArgs {
    provider: Provider;
    model: string;
    messages: any;
    stream?: boolean;
    max_tokens?: number;
    [k: string]: any;
}

export async function callLLM({ provider, model, messages, stream, ...rest }: CallLLMArgs) {
    // remove any system echo messages to satisfy strict provider schemas
    const nonSystemMsgs = (messages ?? []).filter((m: any) => m.role !== "system");
    const c = clients[provider];
    if (!c) throw new Error(`Unsupported provider: ${provider}`);

    switch (provider) {
        case "openai":
            return openai.chat.completions.create({ model, messages: nonSystemMsgs, stream, ...rest });

        case "anthropic": {
            const params: any = {
                model,
                messages: nonSystemMsgs,
                max_tokens: rest.max_tokens ?? 1024,
                ...rest,
            };
            if (stream) params.stream = true; // only set when true
            return anthropic.messages.create(params);
        }
        case "google": {
            const genAI = google as GoogleGenerativeAI;   // reuse singleton
            const mdl = genAI.getGenerativeModel({ model });
            // Gemini API does NOT accept system role — convert all to user/model
            const gemMessages = nonSystemMsgs.map((m: any) => ({
                    role: m.role === "assistant" ? "model" : "user",
                    parts: [{ text: m.content }],
                }));
            return stream
                ? mdl.generateContentStream({ contents: gemMessages }) // upcoming SDK fn
                : mdl.generateContent({ contents: gemMessages });
        }
        case "mistral":
            return stream
                ? mistral.chat.stream({ model, messages: nonSystemMsgs, ...rest })
                : mistral.chat.complete({ model, messages: nonSystemMsgs, ...rest });

        default:
            throw new Error("Provider not wired yet");
    }
}
