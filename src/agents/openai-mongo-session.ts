import type { AgentInputItem, Session } from "@openai/agents";
import { MongoClient } from "mongodb";

let mongoClient: MongoClient | undefined;

async function getMongoClient(): Promise<MongoClient> {
  if (mongoClient) {
    return mongoClient;
  }

  mongoClient = new MongoClient(process.env.MONGODB_URI || "");
  await mongoClient.connect();

  return mongoClient;
}

export class MongoSession implements Session {
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
      .collection<{
        created_at: Date;
        item: AgentInputItem;
        session_id: string;
      }>("memories");

    if (limit === undefined) {
      const documents = await collection
        .find({ session_id: this.sessionId })
        .sort({ created_at: 1, _id: 1 })
        .toArray();

      return documents.map((document) => document.item);
    }

    const documents = await collection
      .find({ session_id: this.sessionId })
      .sort({ created_at: -1, _id: -1 })
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
      .collection<{
        created_at: Date;
        item: AgentInputItem;
        session_id: string;
      }>("memories");

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
      .collection<{
        created_at: Date;
        item: AgentInputItem;
        session_id: string;
      }>("memories");

    const result = await collection.findOneAndDelete(
      { session_id: this.sessionId },
      { sort: { created_at: -1, _id: -1 } },
    );

    return result?.item;
  }

  public async clearSession(): Promise<void> {
    const collection = (await getMongoClient())
      .db("telegram-agent-framework")
      .collection<{
        created_at: Date;
        item: AgentInputItem;
        session_id: string;
      }>("memories");

    await collection.deleteMany({ session_id: this.sessionId });
  }
}
