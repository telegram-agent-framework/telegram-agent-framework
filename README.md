# telegram-agent-framework

Minimal TypeScript Fastify API.

## Requirements

- Node.js 25 or newer
- npm

## Setup

```sh
npm install
```

## Development

```sh
npm run dev
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

## Start

```sh
npm start
```
