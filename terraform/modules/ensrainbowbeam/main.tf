resource "render_web_service" "ensrainbowbeam" {
  name           = "ensrainbowbeam"
  plan           = var.render_instance_plan
  region         = var.render_region
  environment_id = var.render_environment_id

  runtime_source = {
    image = {
      image_url = "ghcr.io/namehash/ensnode/ensrainbowbeam"
      tag       = var.ensnode_version
    }
  }

  env_vars = {
    PORT = { value = tostring(var.port) }
    ENSNODE_URL = { value = var.ensnode_url }
  }
}

