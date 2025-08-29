output "ensrainbow_url" {
  value = "http://${render_web_service.ensrainbow.name}:10000"
}
