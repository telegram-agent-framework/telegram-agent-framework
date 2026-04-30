import OpenAI, { toFile } from "openai";
import { agent } from "../agents/openai.ts";
import { getFile, sendChatAction, sendMessage } from "../telegram/api.ts";
import type { TelegramUpdate, TelegramVoice } from "../types/telegram.ts";

const openai = new OpenAI();

export async function telegramHandler(update: TelegramUpdate): Promise<void> {
  const message = update.message;

  if (!message?.text && !message?.voice) {
    return;
  }

  if (message.from?.is_bot) {
    return;
  }

  const chatId = message.chat.id;

  await sendChatAction(chatId, "typing");

  if (message.voice) {
    await sendMessage(
      chatId,
      await agent(String(chatId), await transcribeVoice(message.voice)),
      {
        // parse_mode: "MarkdownV2",
      },
    );

    return;
  }

  if (message.text) {
    await sendMessage(chatId, await agent(String(chatId), message.text), {
      // parse_mode: "MarkdownV2",
    });

    return;
  }
}

async function transcribeVoice(voice: TelegramVoice): Promise<string> {
  const audio = await downloadTelegramFile(voice.file_id);
  const file = await toFile(audio, "voice.ogg", {
    type: voice.mime_type ?? "audio/ogg",
  });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "gpt-4o-mini-transcribe",
  });

  return transcription.text;
}

async function downloadTelegramFile(fileId: string): Promise<ArrayBuffer> {
  const file = await getFile(fileId);

  if (!file.file_path) {
    throw new Error("Telegram getFile response did not include file_path.");
  }

  const response = await fetch(
    `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`,
  );

  if (!response.ok) {
    throw new Error(`Telegram file download failed with ${response.status}.`);
  }

  return response.arrayBuffer();
}
