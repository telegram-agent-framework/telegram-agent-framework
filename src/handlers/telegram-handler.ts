import { agent } from "../agents/openai.ts";
import type {
  TelegramSendMessageResponse,
  TelegramUpdate,
} from "../types/telegram.ts";

export async function telegramHandler(update: TelegramUpdate): Promise<void> {
  const message = update.message;

  if (!message?.text || message.from?.is_bot) {
    return;
  }

  const response = await agent(String(message.chat.id), message.text);
  const responseText = response.trim();

  if (!responseText) {
    return;
  }

  await sendTelegramMessage(message.chat.id, responseText);
}

async function sendTelegramMessage(
  chatId: number,
  text: string,
): Promise<void> {
  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    },
  );

  const body = (await response.json()) as TelegramSendMessageResponse;

  if (!body.ok) {
    throw new Error(body.description ?? "Telegram sendMessage failed.");
  }
}
