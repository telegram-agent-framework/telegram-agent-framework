output "pubsub_topic" {
  value = google_pubsub_topic.queue.name
}

output "webhook_url" {
  value = google_cloudfunctions2_function.webhook.service_config[0].uri
}
