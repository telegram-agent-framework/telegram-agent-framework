import "dotenv/config";
import Fastify from "fastify";
import { telegramHandler } from "./handlers/telegram-handler.ts";
import type { TelegramUpdate } from "./types/telegram.ts";

const app = Fastify({
  logger: true
});

app.get("/health", async () => {
  return { status: "ok" };
});

app.post<{ Body: TelegramUpdate }>("/webhook", async (request, reply) => {
  await telegramHandler(request.body);

  return reply.status(204).send();
});

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
