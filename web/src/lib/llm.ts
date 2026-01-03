import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { BashCommandSchema, type BashCommandResult } from "./schema";

async function loadPrompt(): Promise<string> {
  // Try repo-root `prompt/prompt.txt` first (used when server runs from repo root).
  const rootPrompt = path.join(process.cwd(), "prompt", "prompt.txt");
  try {
    return await fs.readFile(rootPrompt, "utf-8");
  } catch {
    // Fallback: look in `web/prompt/prompt.txt` which is present in this repo.
    const webPrompt = path.join(process.cwd(), "web", "prompt", "prompt.txt");
    return fs.readFile(webPrompt, "utf-8");
  }
}

function buildUserMessage(params: { input: string; os?: string }) {
  const os = params.os ?? "wsl";
  // Keep the user message simple and explicit
  return `OS: ${os}
Task: ${params.input}`;
}

export async function generateBashFromText(params: {
  input: string;
  os?: "linux" | "macos" | "wsl";
}): Promise<BashCommandResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY in environment.");
  }

  // Create the OpenAI client lazily so importing this module doesn't throw
  // when `OPENAI_API_KEY` is not present (helps local dev without secrets).
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemPrompt = await loadPrompt();
  const userMessage = buildUserMessage({ input: params.input, os: params.os });

  // Pick a good default model. You can change later.
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  const resp = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
    temperature: 0.2
  });

  const content = resp.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from model.");

  // The prompt demands JSON-only. We still parse defensively.
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Model did not return valid JSON.");
  }

  const validated = BashCommandSchema.parse(parsed);

  // Extra sanity check: explanations length should match commands length if possible
  if (validated.explanations.length !== validated.commands.length) {
    // Don’t fail hard; fix it into something safe for UI.
    // If mismatch, pad or trim explanations.
    const fixed = { ...validated };
    if (fixed.explanations.length < fixed.commands.length) {
      while (fixed.explanations.length < fixed.commands.length) {
        fixed.explanations.push("Explanation not provided.");
      }
    } else {
      fixed.explanations = fixed.explanations.slice(0, fixed.commands.length);
    }
    return fixed;
  }

  return validated;
}
