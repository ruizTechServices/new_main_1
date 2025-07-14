//app/api/chat/route.ts
import { z } from "zod";
import { callLLM } from "@/lib/llmRouter";

export const runtime = "edge";    // streams fast, no Node-only deps

const Message = z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
});

const schema = z.object({
    provider: z.enum(["openai", "anthropic", "google", "mistral", "deepseek", "hf"]),
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
    catch (err) {
        return Response.json({ error: err.issues ?? err.message }, { status: 400 });
    }

    try {
        const result = await callLLM(body);
        if (body.stream) {
            return new Response(result, {
                headers: { "Content-Type": "text/event-stream" },
            });
        }
        return Response.json(result);
    } catch (err) {
        console.error("[/api/chat]", err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
