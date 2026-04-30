import { tool, type RunContext } from "@openai/agents";
import { MongoClient, ObjectId, type Collection } from "mongodb";
import { z } from "zod";

type AgentContext = {
  sessionId: string;
};

type TodoDocument = {
  _id: ObjectId;
  session_id: string;
  title: string;
  completed: boolean;
  created_at: Date;
  updated_at: Date;
};

let mongoClient: MongoClient | undefined;
let todoCollection: Collection<TodoDocument> | undefined;

async function getTodoCollection(): Promise<Collection<TodoDocument>> {
  if (todoCollection) {
    return todoCollection;
  }

  mongoClient ??= new MongoClient(process.env.MONGODB_URI || "");
  await mongoClient.connect();

  todoCollection = mongoClient
    .db("telegram-agent-framework")
    .collection<TodoDocument>("todos");

  await todoCollection.createIndex({ session_id: 1, created_at: 1 });

  return todoCollection;
}

function getSessionId(runContext?: RunContext<AgentContext>): string {
  const sessionId = runContext?.context.sessionId;

  if (!sessionId) {
    throw new Error("Missing agent session id.");
  }

  return sessionId;
}

function serializeTodo(todo: TodoDocument) {
  return {
    id: todo._id.toString(),
    title: todo.title,
    completed: todo.completed,
    created_at: todo.created_at.toISOString(),
    updated_at: todo.updated_at.toISOString(),
  };
}

export const createTodoTool = tool({
  name: "create_todo",
  description: "Create a todo item for the current Telegram chat.",
  parameters: z.object({
    title: z.string().min(1).describe("The todo item title."),
  }),
  async execute({ title }, runContext) {
    const collection = await getTodoCollection();
    const now = new Date();
    const todo: TodoDocument = {
      _id: new ObjectId(),
      session_id: getSessionId(runContext),
      title,
      completed: false,
      created_at: now,
      updated_at: now,
    };

    await collection.insertOne(todo);

    return serializeTodo(todo);
  },
});

export const listTodosTool = tool({
  name: "list_todos",
  description: "List todo items for the current Telegram chat.",
  parameters: z.object({}),
  async execute(_args, runContext) {
    const collection = await getTodoCollection();
    const todos = await collection
      .find({ session_id: getSessionId(runContext) })
      .sort({ created_at: 1, _id: 1 })
      .toArray();

    return todos.map(serializeTodo);
  },
});

export const updateTodoTool = tool({
  name: "update_todo",
  description: "Update a todo item's title or completion status.",
  parameters: z.object({
    id: z.string().describe("The todo id."),
    title: z
      .string()
      .min(1)
      .nullable()
      .describe("The new todo title, or null when the title should not change."),
    completed: z
      .boolean()
      .nullable()
      .describe("Whether the todo is completed, or null when it should not change."),
  }),
  async execute({ id, title, completed }, runContext) {
    if (!ObjectId.isValid(id)) {
      return { found: false };
    }

    const collection = await getTodoCollection();
    const update: Partial<Pick<TodoDocument, "title" | "completed" | "updated_at">> = {
      updated_at: new Date(),
    };

    if (title !== null) {
      update.title = title;
    }

    if (completed !== null) {
      update.completed = completed;
    }

    if (title === null && completed === null) {
      return { updated: false };
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), session_id: getSessionId(runContext) },
      { $set: update },
      { returnDocument: "after" },
    );

    if (!result) {
      return { found: false };
    }

    return serializeTodo(result);
  },
});

export const deleteTodoTool = tool({
  name: "delete_todo",
  description: "Delete a todo item.",
  parameters: z.object({
    id: z.string().describe("The todo id."),
  }),
  async execute({ id }, runContext) {
    if (!ObjectId.isValid(id)) {
      return { deleted: false };
    }

    const collection = await getTodoCollection();
    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      session_id: getSessionId(runContext),
    });

    return { deleted: result.deletedCount === 1 };
  },
});

export const todoTools = [
  createTodoTool,
  listTodosTool,
  updateTodoTool,
  deleteTodoTool,
];
