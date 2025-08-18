resource "render_web_service" "ensrainbow" {
  name           = "ensrainbow"
  plan           = "starter"
  region         = var.render_region
  environment_id = var.render_environment_id

  runtime_source = {
    image = {
      image_url = "ghcr.io/namehash/ensnode/ensrainbow"
      tag       = var.ensnode_version
    }
  }

  env_vars = {
    "LOG_LEVEL" = { value = "error" }
  }

}
