//lib\clients.ts
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mistral } from "@mistralai/mistralai";          // etc.

export const clients = {
  openai:    new OpenAI({ apiKey: process.env.OPENAI_API_KEY! }),
  anthropic: new Anthropic({ apiKey: process.env.ANTHROPIC_KEY! }),
  google:    new GoogleGenerativeAI(process.env.GEMINI_KEY!),
  mistral:   new Mistral({ apiKey: process.env.MISTRAL_KEY! }),
};


