import type {
  TelegramAnswerCallbackQueryResponse,
  TelegramEditMessageTextResponse,
  TelegramFile,
  TelegramGetFileResponse,
  TelegramGetUpdatesResponse,
  TelegramMessage,
  TelegramReplyMarkup,
  TelegramSendChatActionResponse,
  TelegramSendDocumentResponse,
  TelegramSendMessageResponse,
  TelegramSendPhotoResponse,
  TelegramUpdate,
} from "../types/telegram.ts";

function botUrl(method: string): string {
  return `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;
}

async function post<T>(
  method: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(botUrl(method), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  return (await response.json()) as T;
}

export async function getFile(fileId: string): Promise<TelegramFile> {
  const body = await post<TelegramGetFileResponse>("getFile", {
    file_id: fileId,
  });

  if (!body.ok) {
    throw new Error(body.description ?? "Telegram getFile failed.");
  }

  return body.result;
}

export async function sendChatAction(
  chatId: number,
  action: string,
): Promise<void> {
  const body = await post<TelegramSendChatActionResponse>("sendChatAction", {
    chat_id: chatId,
    action,
  });

  if (!body.ok) {
    console.error("Telegram sendChatAction failed", {
      chat_id: chatId,
      description: body.description,
      error_code: body.error_code,
    });

    throw new Error(body.description ?? "Telegram sendChatAction failed.");
  }
}

export async function sendMessage(
  chatId: number,
  text: string,
  options?: {
    parse_mode?: "MarkdownV2" | "HTML";
    reply_markup?: TelegramReplyMarkup;
  },
): Promise<TelegramMessage> {
  const body = await post<TelegramSendMessageResponse>("sendMessage", {
    chat_id: chatId,
    text,
    ...options,
  });

  if (!body.ok) {
    throw new Error(body.description ?? "Telegram sendMessage failed.");
  }

  return body.result;
}

export async function editMessageText(
  chatId: number,
  messageId: number,
  text: string,
  options?: {
    parse_mode?: "MarkdownV2" | "HTML";
    reply_markup?: TelegramReplyMarkup;
  },
): Promise<TelegramMessage> {
  const body = await post<TelegramEditMessageTextResponse>("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    ...options,
  });

  if (!body.ok) {
    throw new Error(body.description ?? "Telegram editMessageText failed.");
  }

  return body.result;
}

export async function sendPhoto(
  chatId: number,
  photo: string,
  options?: {
    caption?: string;
    parse_mode?: "MarkdownV2" | "HTML";
    reply_markup?: TelegramReplyMarkup;
  },
): Promise<TelegramMessage> {
  const body = await post<TelegramSendPhotoResponse>("sendPhoto", {
    chat_id: chatId,
    photo,
    ...options,
  });

  if (!body.ok) {
    throw new Error(body.description ?? "Telegram sendPhoto failed.");
  }

  return body.result;
}

export async function sendDocument(
  chatId: number,
  document: string,
  options?: {
    caption?: string;
    parse_mode?: "MarkdownV2" | "HTML";
    reply_markup?: TelegramReplyMarkup;
  },
): Promise<TelegramMessage> {
  const body = await post<TelegramSendDocumentResponse>("sendDocument", {
    chat_id: chatId,
    document,
    ...options,
  });

  if (!body.ok) {
    throw new Error(body.description ?? "Telegram sendDocument failed.");
  }

  return body.result;
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  options?: {
    text?: string;
    show_alert?: boolean;
  },
): Promise<void> {
  const body = await post<TelegramAnswerCallbackQueryResponse>(
    "answerCallbackQuery",
    {
      callback_query_id: callbackQueryId,
      ...options,
    },
  );

  if (!body.ok) {
    throw new Error(
      body.description ?? "Telegram answerCallbackQuery failed.",
    );
  }
}

export async function getUpdates(params: {
  timeout?: number;
  offset?: number;
}): Promise<TelegramUpdate[]> {
  const url = new URL(botUrl("getUpdates"));

  if (params.timeout !== undefined) {
    url.searchParams.set("timeout", String(params.timeout));
  }

  if (params.offset !== undefined) {
    url.searchParams.set("offset", String(params.offset));
  }

  const response = await fetch(url);
  const body = (await response.json()) as TelegramGetUpdatesResponse;

  if (!body.ok) {
    throw new Error(body.description ?? "Telegram getUpdates failed.");
  }

  return body.result;
}
