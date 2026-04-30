# Telegram Agent Framework

A minimal TypeScript starter for building Telegram bots powered by OpenAI Agents.

Telegram Agent Framework helps you wire a Telegram bot to an OpenAI Agent with a configurable system prompt, tool calling, per-chat memory, and a deployable webhook pipeline. It is intentionally small: the core pieces are easy to inspect, replace, and extend for your own bot.

## Why this exists

Building an agentic Telegram bot usually means stitching together several concerns:

- receiving Telegram updates
- sending chat actions and replies
- managing OpenAI Agent sessions
- adding custom tools
- storing per-chat state
- moving from local development to webhook-based deployment

This project provides a working baseline for that flow without turning it into a large framework.

## Features

- **Telegram bot handling**: receives user messages, ignores bot messages, sends typing indicators, and replies back to the chat.
- **OpenAI Agents SDK**: uses `@openai/agents` to run an agent with a system prompt and optional tools.
- **Configurable prompt**: edit `prompts/system.md` to change the bot behavior.
- **Tool calling**: includes a MongoDB-backed todo tool example with create, list, update, and delete operations.
- **Per-chat memory**: stores agent session history by Telegram chat ID when MongoDB is configured.
- **Local development mode**: runs with Telegram `getUpdates` polling via `npm run dev`.
- **GCP deployment path**: includes Terraform and a deploy script for Cloud Functions, Pub/Sub, and Telegram webhooks.

## Demo

Try the sample todo bot:

https://t.me/simple_todo_app_bot

## Requirements

- Node.js 22+
- npm
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- An OpenAI API key
- MongoDB, if you want persistent memory and the included todo tools
- Google Cloud SDK and Terraform, if you want to deploy to GCP

## Installation

Clone the repository and install dependencies:

```sh
git clone https://github.com/telegram-agent-framework/telegram-agent-framework.git
cd telegram-agent-framework
npm install
```

Create a `.env` file:

```sh
cp .env.template .env
```

Add the required values:

```sh
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
OPENAI_API_KEY=your-openai-api-key

# Required for persistent memory and the included todo tools.
# For local development, this can point to a local MongoDB instance.
MONGODB_URI=mongodb://127.0.0.1:27017
```

## Create a Telegram bot

1. Open [@BotFather](https://t.me/BotFather) in Telegram.
2. Send `/newbot`.
3. Follow the prompts.
4. Copy the bot token into `TELEGRAM_BOT_TOKEN` in `.env`.

## Run locally

Start MongoDB if you are using the included todo tools.

For example, with Homebrew:

```sh
brew services start mongodb-community
```

Then run the local polling worker:

```sh
npm run dev
```

Send a message to your Telegram bot.

Example messages for the included todo assistant:

```text
Add "buy coffee" to my todo list
Show my todos
Mark the coffee todo as done
Delete the coffee todo
```

## How it works

The local development process uses Telegram polling:

```text
Telegram getUpdates -> telegramHandler -> OpenAI Agent -> tools/session storage -> Telegram reply
```

The GCP deployment uses webhooks and Pub/Sub:

```text
Telegram webhook -> Cloud Function HTTP endpoint -> Pub/Sub -> Cloud Function worker -> OpenAI Agent -> Telegram reply
```

Core files:

- `src/dev.ts` runs the local polling loop.
- `src/main.ts` exposes the GCP HTTP webhook and Pub/Sub worker handlers.
- `src/handlers/telegram-handler.ts` converts Telegram messages into agent runs and sends replies.
- `src/agents/openai.ts` configures the OpenAI Agent.
- `src/agents/openai-mongo-session.ts` stores agent session history in MongoDB.
- `src/tools/todo-tools.ts` shows how to define custom tools.

## Customize the agent

Edit the system prompt:

```text
prompts/system.md
```

The default prompt turns the bot into a todo list assistant. Replace it with instructions for your own bot.

## Add tools

Tools are registered from `src/tools/index.ts`.

The included todo tools show the expected pattern:

```ts
import { tool } from "@openai/agents";
import { z } from "zod";

export const exampleTool = tool({
  name: "example_tool",
  description: "Describe what this tool does.",
  parameters: z.object({
    input: z.string(),
  }),
  async execute({ input }, runContext) {
    return {
      result: input,
    };
  },
});
```

Then export the tool from `src/tools/index.ts`:

```ts
import { exampleTool } from "./example-tool.ts";

export const tools = [
  exampleTool,
];
```

Tool execution receives the agent run context, including the Telegram chat session ID when configured by the handler.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram bot token from BotFather. |
| `OPENAI_API_KEY` | Yes | API key used by the OpenAI Agents SDK. |
| `MONGODB_URI` | Recommended | Enables MongoDB-backed memory and the included todo tools. |
| `GCP_PROJECT_ID` | Deploy only | Google Cloud project ID. |
| `GCP_REGION` | Deploy only | Google Cloud region. Defaults to `us-central1` in the deploy script. |
| `PUB_SUB_TOPIC` | Deploy only | Pub/Sub topic name. Defaults to `telegram-updates`. |

## Deploy to Google Cloud

The deployment creates:

- a public HTTP Cloud Function for Telegram webhooks
- a Pub/Sub topic for queued updates
- a worker Cloud Function triggered by Pub/Sub
- a storage bucket for function source archives

Install the Google Cloud SDK if needed:

```sh
brew install --cask google-cloud-sdk
```

Add deployment values to `.env`:

```sh
GCP_PROJECT_ID=your-gcp-project-id
GCP_REGION=us-central1
PUB_SUB_TOPIC=telegram-updates
```

Authenticate with Google Cloud:

```sh
gcloud auth login
gcloud auth application-default login
```

Create or select a project:

```sh
gcloud projects create your-gcp-project-id --name="telegram-agent-framework"
gcloud config set project your-gcp-project-id
```

Link billing:

```sh
gcloud billing accounts list
gcloud billing projects link your-gcp-project-id --billing-account=YOUR_BILLING_ACCOUNT_ID
```

Enable required APIs:

```sh
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  cloudfunctions.googleapis.com \
  eventarc.googleapis.com \
  pubsub.googleapis.com \
  run.googleapis.com \
  storage.googleapis.com
```

Deploy:

```sh
./scripts/deploy.sh
```

The deploy script applies Terraform and sets the Telegram webhook to the deployed HTTP function URL.

## Project status

This project is early-stage and intentionally small. It is suitable as a starter template, learning reference, or foundation for a custom Telegram agent bot.

## Contributing

Contributions are welcome.

Good first areas to improve:

- setup documentation
- tests for Telegram update handling and tool behavior
- additional example tools
- better local development scripts
- deployment hardening
- screenshots or demo recordings

Before opening a pull request, please keep changes focused and avoid introducing large abstractions unless they simplify the current implementation.

## License

MIT
