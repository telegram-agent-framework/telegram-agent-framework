import process from "node:process";
import "dotenv/config";
import { telegramHandler } from "./handlers/telegram-handler.ts";
import { getUpdates } from "./telegram/api.ts";

let offset: number | undefined = undefined;

while (true) {
  const updates = await getUpdates({ timeout: 30, offset });

  for (const update of updates) {
    await telegramHandler(update);

    offset = update.update_id + 1;
  }
}
