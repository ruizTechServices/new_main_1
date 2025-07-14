//app/api/chat/route.ts
import { z } from "zod";
import { callLLM } from "@/lib/llmRouter";

export const runtime = "edge";    // streams fast, no Node-only deps

const Message = z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
});

const schema = z.object({
    provider: z.enum(["openai", "anthropic", "google", "mistral"]), // deepseek/hf planned
    model: z.string(),
    messages: z.array(Message).min(1),
    stream: z.boolean().optional().default(false),

    // optional knobs w/ sane defaults
    temperature: z.number().min(0).max(2).default(1),
    top_p: z.number().min(0).max(1).default(1),
    tools: z.any().optional(),
});

export async function POST(req: Request): Promise<Response> {
    let body;
    try { body = schema.parse(await req.json()); }
    catch (err: unknown) {
        const msg =
            err && typeof err === "object" && "issues" in err
                ? (err as any).issues
                : err instanceof Error
                ? err.message
                : String(err);
        return Response.json({ error: msg }, { status: 400 });
    }

    try {
        const result: unknown = await callLLM(body);

        if (body.stream) {
            // 1. SDKs (OpenAI, Mistral) expose .toReadableStream()
            if (result && typeof (result as any).toReadableStream === "function") {
                return new Response((result as any).toReadableStream(), {
                    headers: { "Content-Type": "text/event-stream" },
                });
            }

            // 2. Some providers (Anthropic, Gemini) give an async iterator
            if (result && typeof result === "object" && Symbol.asyncIterator in (result as any)) {
                const rs = new ReadableStream({
                    async start(controller) {
                        const enc = new TextEncoder();
                        for await (const chunk of result as AsyncIterable<any>) {
                            const payload =
                                typeof chunk === "string" ? chunk : JSON.stringify(chunk);
                            controller.enqueue(enc.encode(payload));
                        }
                        controller.close();
                    },
                });
                return new Response(rs, {
                    headers: { "Content-Type": "text/event-stream" },
                });
            }

            // 3. Fallback – nothing streamable returned
            return Response.json(
                { error: "Provider did not return a stream" },
                { status: 500 },
            );
        }

        // Non-streaming: simply return JSON
        return Response.json(result);
    } catch (err: unknown) {
        console.error("[/api/chat]", err);
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ error: msg }, { status: 500 });
    }
}
