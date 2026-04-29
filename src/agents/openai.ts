import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Agent, run } from "@openai/agents";
import type { AgentInputItem, Session } from "@openai/agents";
import { MongoClient } from "mongodb";

type MemoryDocument = {
  created_at: Date;
  item: AgentInputItem;
  session_id: string;
};

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

let mongoClient: MongoClient | undefined;

export async function agent(sessionId: string, message: string): Promise<string> {
  const instructions = await readFile(
    resolve(rootDirectory, "prompts/system.md"),
    "utf8",
  );

  const assistant = new Agent({
    name: "Telegram Agent",
    instructions: instructions.replace(/^---\n[\s\S]*?\n---\n?/, "").trim(),
  });

  const result = await run(assistant, message, {
    session: new MongoSession(sessionId),
  });

  return result.finalOutput ?? "";
}

async function getMongoClient(): Promise<MongoClient> {
  if (mongoClient) {
    return mongoClient;
  }

  mongoClient = new MongoClient(process.env.MONGODB_URI || "");
  await mongoClient.connect();

  return mongoClient;
}

class MongoSession implements Session {
  private readonly sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  public async getSessionId(): Promise<string> {
    return this.sessionId;
  }

  public async getItems(limit?: number): Promise<AgentInputItem[]> {
    const collection = (await getMongoClient())
      .db("telegram-agent-framework")
      .collection<MemoryDocument>("memory");

    if (limit === undefined) {
      const documents = await collection
        .find({ sessionId: this.sessionId })
        .sort({ createdAt: 1, _id: 1 })
        .toArray();

      return documents.map((document) => document.item);
    }

    const documents = await collection
      .find({ sessionId: this.sessionId })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray();

    return documents.reverse().map((document) => document.item);
  }

  public async addItems(items: AgentInputItem[]): Promise<void> {
    if (items.length === 0) {
      return;
    }

    const collection = (await getMongoClient())
      .db("telegram-agent-framework")
      .collection<MemoryDocument>("memory");

    await collection.insertMany(
      items.map((item) => ({
        session_id: this.sessionId,
        item,
        created_at: new Date(),
      })),
    );
  }

  public async popItem(): Promise<AgentInputItem | undefined> {
    const collection = (await getMongoClient())
      .db("telegram-agent-framework")
      .collection<MemoryDocument>("memory");

    const result = await collection.findOneAndDelete(
      { sessionId: this.sessionId },
      { sort: { createdAt: -1, _id: -1 } },
    );

    return result?.item;
  }

  public async clearSession(): Promise<void> {
    const collection = (await getMongoClient())
      .db("telegram-agent-framework")
      .collection<MemoryDocument>("memory");

    await collection.deleteMany({ sessionId: this.sessionId });
  }
}
