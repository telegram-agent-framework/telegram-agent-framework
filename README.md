# Telegram Agent Framework

Telegram Agent Framework is a minimal framework for building a self-hosted Telegram bot backed by an OpenAI Agent. Configure the bot with a system prompt, add tools when needed, and run it locally with Telegram polling or deploy it as a webhook worker.

Try the demo bot: https://t.me/simple_todo_app_bot

## Features

- Telegram bot integration using the Bot API
- OpenAI Agents SDK for agent orchestration
- System prompt configuration in `prompts/system.md`
- Optional MongoDB-backed conversation memory
- Example todo tools backed by MongoDB
- Local development with Telegram `getUpdates`
- Optional Google Cloud Functions + Pub/Sub deployment

## Requirements

- Node.js 22 or newer
- npm
- Telegram bot token
- OpenAI API key
- MongoDB URI, optional for local development and required for persistent memory/tools

## Quick Start

Create a Telegram bot:

1. Message `@BotFather` on Telegram.
2. Send `/newbot` and follow the prompts.
3. Copy the bot token.

Install dependencies:

```sh
npm install
```

Create a `.env` file:

```sh
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
OPENAI_API_KEY=your_openai_api_key

# Optional locally. Enables persistent memory and todo tools.
MONGODB_URI=mongodb://localhost:27017
```

Start the bot locally:

```sh
npm run dev
```

Send a message to your bot in Telegram.

Local mode uses Telegram polling, so you do not need a public URL, webhook, or cloud account. If `MONGODB_URI` is not set, the bot uses in-memory conversation history and disables tools.

## Configuration

The default agent is configured as a concise todo assistant:

- Edit `prompts/system.md` to change the bot's behavior.
- Add or replace tools in `src/tools`.
- Update the agent setup in `src/agents/openai.ts` if you want to change the model, session behavior, or tool registration.

The included todo tools are scoped by Telegram chat ID, so each chat gets its own todo list.

## Deployment

This repository includes an optional Google Cloud deployment path using Cloud Functions, Pub/Sub, and Terraform.

Required deployment variables:

```sh
GCP_PROJECT_ID=your_gcp_project_id
GCP_REGION=us-central1
PUB_SUB_TOPIC=telegram-updates
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
OPENAI_API_KEY=your_openai_api_key
MONGODB_URI=your_mongodb_uri
```

Deploy:

```sh
./scripts/deploy.sh
```

The deploy script applies Terraform and registers the Telegram webhook automatically.

## Scripts

```sh
npm run dev             # Run local Telegram polling
npm run start:webhook   # Run the HTTP webhook function locally
npm run start:worker    # Run the Pub/Sub worker function locally
```

## License

MIT
