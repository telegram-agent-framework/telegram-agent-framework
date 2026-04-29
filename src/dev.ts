import process from "node:process";
import "dotenv/config";
import { telegramHandler } from "./handlers/telegram-handler.ts";
import type {
  TelegramGetUpdatesResponse,
  TelegramUpdate,
} from "./types/telegram.ts";

let offset: number | undefined = undefined;

async function getUpdates(): Promise<TelegramUpdate[]> {
  const url = new URL(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getUpdates`,
  );

  url.searchParams.set("timeout", "30");

  if (offset !== undefined) {
    url.searchParams.set("offset", String(offset));
  }

  const response = await fetch(url);

  const body = (await response.json()) as TelegramGetUpdatesResponse;

  if (!body.ok) {
    throw new Error("ERROR");
  }

  return body.result;
}

while (true) {
  const updates = await getUpdates();

  for (const update of updates) {
    console.log(`update_id: ${update.update_id}`);
    await telegramHandler(update);

    offset = update.update_id + 1;
  }
}
