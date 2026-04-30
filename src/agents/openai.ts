import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Agent, MemorySession, run } from "@openai/agents";
import { tools } from "../tools/index.ts";
import { MongoSession } from "./openai-mongo-session.ts";

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export async function agent(
  sessionId: string,
  message: string,
): Promise<string> {
  const instructions = await readFile(
    resolve(rootDirectory, "prompts/system.md"),
    "utf8",
  );

  const hasMongo = Boolean(process.env.MONGODB_URI);

  const assistant = new Agent<{ sessionId: string }>({
    name: "Telegram Agent",
    instructions: instructions.replace(/^---\n[\s\S]*?\n---\n?/, "").trim(),
    model: "gpt-4.1-mini",
    tools: hasMongo ? tools : [],
  });

  const result = await run(assistant, message, {
    session: hasMongo
      ? new MongoSession(sessionId)
      : new MemorySession(sessionId),
    context: { sessionId },
  });

  return result.finalOutput ?? "";
}
