 // server component

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

import ChatbotMain from "@/components/chatbot_main/ChatbotMain";

export default function ChatbotBasicPage() {
  return <ChatbotMain />;
}