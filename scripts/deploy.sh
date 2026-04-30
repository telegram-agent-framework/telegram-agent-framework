#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

require_env() {
  local name="$1"

  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

GCP_REGION="${GCP_REGION:-us-central1}"
PUB_SUB_TOPIC="${PUB_SUB_TOPIC:-telegram-updates}"

require_env "GCP_PROJECT_ID"
require_env "TELEGRAM_BOT_TOKEN"
require_env "OPENAI_API_KEY"
require_env "MONGODB_URI"

echo "Telegram Agent Framework deploy"
echo
echo "Project: $GCP_PROJECT_ID"
echo "Region: $GCP_REGION"
echo "Pub/Sub topic: $PUB_SUB_TOPIC"
echo

terraform -chdir="$ROOT_DIR/terraform" init
terraform -chdir="$ROOT_DIR/terraform" apply \
  -var="project_id=$GCP_PROJECT_ID" \
  -var="region=$GCP_REGION" \
  -var="pub_sub_topic=$PUB_SUB_TOPIC" \
  -var="telegram_bot_token=$TELEGRAM_BOT_TOKEN" \
  -var="openai_api_key=$OPENAI_API_KEY" \
  -var="mongodb_uri=$MONGODB_URI" \
  -auto-approve

WEBHOOK_URL="$(terraform -chdir="$ROOT_DIR/terraform" output -raw webhook_url)"

echo
echo "Setting Telegram webhook..."

curl -sS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  --data-urlencode "url=${WEBHOOK_URL}"

echo
echo
echo "Done."
echo "Webhook URL: $WEBHOOK_URL"
