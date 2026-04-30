import "dotenv/config";
import type { Request, Response } from "@google-cloud/functions-framework";
import { PubSub } from "@google-cloud/pubsub";
import { telegramHandler } from "./handlers/telegram-handler.ts";
import type { TelegramUpdate } from "./types/telegram.ts";

const pubsub = new PubSub();

export async function handleHttp(
  request: Request,
  response: Response,
): Promise<void> {
  if (request.method !== "POST") {
    response.status(405).send("Method Not Allowed");

    return;
  }

  const topic = process.env.PUB_SUB_TOPIC || "telegram-updates";

  await pubsub.topic(topic).publishMessage({
    data: Buffer.from(JSON.stringify(request.body)),
  });

  response.status(204).send();
}

type PubSubCloudEvent = {
  id?: string;
  source?: string;
  type?: string;
  data?:
    | string
    | {
        data?: string;
        message?: {
          data?: string;
          messageId?: string;
          publishTime?: string;
        };
        subscription?: string;
      };
};

export async function handleCloudEvent(
  cloudEvent: PubSubCloudEvent,
): Promise<void> {
  const data = getPubSubMessageData(cloudEvent);

  if (!data) {
    return;
  }

  const update = JSON.parse(
    Buffer.from(data, "base64").toString("utf8"),
  ) as TelegramUpdate;

  await telegramHandler(update);
}

function getPubSubMessageData(
  cloudEvent: PubSubCloudEvent,
): string | undefined {
  if (typeof cloudEvent.data === "string") {
    return cloudEvent.data;
  }

  return cloudEvent.data?.message?.data ?? cloudEvent.data?.data;
}
