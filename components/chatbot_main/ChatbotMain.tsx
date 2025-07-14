"use client";

import { useState, useRef, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const modelCatalog = {
  openai: ["gpt-3.5-turbo", "gpt-4o-mini", "o4-mini-2025-04-16"],
  anthropic: ["claude-3-haiku-20240307", "claude-3-sonnet-20240229"],
  google: ["gemini-1.5-pro-latest"],
  mistral: ["mistral-small-latest"],
} as const;

type Provider = keyof typeof modelCatalog;

export default function ChatbotMain() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [provider, setProvider] = useState<Provider>("openai");
  const [model, setModel] = useState<string>(modelCatalog["openai"][0]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          messages: [...messages, userMsg],
          stream: false,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      let assistantContent: string;
      if (Array.isArray(data.content)) {
        // Anthropic
        assistantContent = data.content.map((p: any) => p.text ?? "").join("");
      } else if (data.response?.candidates?.[0]?.content?.parts) {
        // Gemini
        assistantContent = data.response.candidates[0].content.parts.map((p: any) => p.text || "").join("");
      } else {
        assistantContent =
          data.choices?.[0]?.message?.content ?? data.content ?? JSON.stringify(data);
      }
      const modelEcho = data.model ?? data.modelVersion ?? data.responderId ?? data.response?.model;
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: assistantContent },
        ...(modelEcho ? [{ role: "system" as const, content: `• Provider confirmed model: ${modelEcho}` }] : [])
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { role: "system", content: `Error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="flex flex-col h-full max-h-screen p-4">
      <h1 className="text-2xl font-semibold mb-4">Basic Chatbot</h1>
      <div className="flex flex-wrap gap-4 items-end mb-4">
        <Label className="text-sm">Provider</Label>
        <Select
          value={provider}
          onValueChange={(p: Provider) => {
            setProvider(p);
            setModel(modelCatalog[p][0]);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(modelCatalog).map(p => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Label className="text-sm">Model</Label>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {modelCatalog[provider].map(m => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto border rounded p-3 space-y-3 bg-white/50">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`whitespace-pre-line ${
              m.role === "user" ? "text-right" : "text-left"
            }`}
          >
            <span className="font-medium mr-1">
              {m.role === "user" ? "You:" : m.role === "assistant" ? "Bot:" : "System:"}
            </span>
            {m.content}
          </div>
        ))}
        {loading && <div className="text-sm italic text-gray-500">Thinking…</div>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="mt-4 flex gap-2">
        <Input
          className="flex-1"
          placeholder="Type a message…"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <Button type="submit" disabled={loading}>
          Send
        </Button>
      </form>
    </div>
  );
}
