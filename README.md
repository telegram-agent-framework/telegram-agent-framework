# telegram-agent-framework

Minimal TypeScript Fastify API.

## Requirements

- Node.js 25 or newer
- npm

## Setup

```sh
npm install
```

Create a `.env` file for local environment variables:

```sh
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

## Local Development

```sh
npm run dev
```

This polls Telegram's `getUpdates` endpoint and passes each update to the same handler used by the webhook.

## Webhook Server

```sh
npm start
```

The API listens on `0.0.0.0:3000` by default. Override with `HOST` and `PORT`.

## Health Check

```sh
curl http://localhost:3000/health
```

Expected response:

```json
{ "status": "ok" }
```
