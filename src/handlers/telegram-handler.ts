import { agent } from "../agents/openai.ts";
import type {
  TelegramSendChatActionResponse,
  TelegramSendMessageResponse,
  TelegramUpdate,
} from "../types/telegram.ts";

export async function telegramHandler(update: TelegramUpdate): Promise<void> {
  const message = update.message;

  if (!message?.text) {
    return;
  }

  if (message.from?.is_bot) {
    return;
  }

  await sendTelegramTypingAction(message.chat.id);

  const interval = setInterval(
    () => sendTelegramTypingAction(message.chat.id),
    4000,
  );

  let responseText: string;

  try {
    const response = await agent(String(message.chat.id), message.text);
    responseText = response.trim();
  } finally {
    clearInterval(interval);
  }

  if (!responseText) {
    return;
  }

  await sendTelegramMessage(message.chat.id, responseText);
}

async function sendTelegramTypingAction(chatId: number): Promise<void> {
  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendChatAction`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        action: "typing",
      }),
    },
  );

  const body = (await response.json()) as TelegramSendChatActionResponse;

  if (!body.ok) {
    console.error("Telegram sendChatAction failed", {
      chat_id: chatId,
      description: body.description,
      error_code: body.error_code,
    });

    throw new Error(body.description ?? "Telegram sendChatAction failed.");
  }
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
