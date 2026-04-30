terraform {
  required_providers {
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.7.0"
    }
    google = {
      source  = "hashicorp/google"
      version = ">= 6.0.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.6.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

data "google_project" "project" {
  project_id = var.project_id
}

resource "random_id" "suffix" {
  byte_length = 4
}

resource "google_pubsub_topic" "queue" {
  name = var.pub_sub_topic
}

resource "google_storage_bucket" "source" {
  name                        = "${var.project_id}-telegram-agent-source-${random_id.suffix.hex}"
  location                    = var.region
  uniform_bucket_level_access = true
}

data "archive_file" "source" {
  type        = "zip"
  source_dir  = "${path.module}/.."
  output_path = "${path.module}/function-source.zip"

  excludes = [
    ".env",
    ".git/**",
    "node_modules/**",
    "terraform/.terraform/**",
    "terraform/function-source.zip",
  ]
}

resource "google_storage_bucket_object" "source" {
  name   = "function-source-${data.archive_file.source.output_md5}.zip"
  bucket = google_storage_bucket.source.name
  source = data.archive_file.source.output_path
}

locals {
  environment_variables = {
    MONGODB_URI        = var.mongodb_uri
    OPENAI_API_KEY     = var.openai_api_key
    PUB_SUB_TOPIC      = google_pubsub_topic.queue.name
    TELEGRAM_BOT_TOKEN = var.telegram_bot_token
  }
}

resource "google_cloudfunctions2_function" "webhook" {
  name     = "telegram-agent-webhook"
  location = var.region

  depends_on = [
    google_project_iam_member.cloud_functions_artifact_registry_reader,
  ]

  build_config {
    runtime     = "nodejs22"
    entry_point = "handleHttp"

    source {
      storage_source {
        bucket = google_storage_bucket.source.name
        object = google_storage_bucket_object.source.name
      }
    }
  }

  service_config {
    available_memory               = "256M"
    environment_variables          = local.environment_variables
    max_instance_count             = 5
    timeout_seconds                = 30
    all_traffic_on_latest_revision = true
  }
}

resource "google_cloudfunctions2_function" "worker" {
  name     = "telegram-agent-worker"
  location = var.region

  depends_on = [
    google_project_iam_member.cloud_functions_artifact_registry_reader,
  ]

  build_config {
    runtime     = "nodejs22"
    entry_point = "handleCloudEvent"

    source {
      storage_source {
        bucket = google_storage_bucket.source.name
        object = google_storage_bucket_object.source.name
      }
    }
  }

  service_config {
    available_memory               = "512M"
    environment_variables          = local.environment_variables
    max_instance_count             = 5
    timeout_seconds                = 300
    all_traffic_on_latest_revision = true
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.queue.id
    retry_policy   = "RETRY_POLICY_RETRY"
  }
}

resource "google_cloud_run_service_iam_member" "webhook_public" {
  location = google_cloudfunctions2_function.webhook.location
  service  = google_cloudfunctions2_function.webhook.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_project_iam_member" "cloud_functions_artifact_registry_reader" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:service-${data.google_project.project.number}@gcf-admin-robot.iam.gserviceaccount.com"
}
