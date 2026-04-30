variable "mongodb_uri" {
  type      = string
  sensitive = true
}

variable "openai_api_key" {
  type      = string
  sensitive = true
}

variable "project_id" {
  type = string
}

variable "pub_sub_topic" {
  type    = string
  default = "telegram-updates"
}

variable "region" {
  type    = string
  default = "us-central1"
}

variable "telegram_bot_token" {
  type      = string
  sensitive = true
}
