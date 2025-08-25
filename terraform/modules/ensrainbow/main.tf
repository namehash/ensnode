locals {
  mount_path = "/app/apps/ensrainbow/data"
}

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

  disk = {
    name       = "ensrainbow-data"
    size_gb    = 30
    mount_path = local.mount_path
  }

  env_vars = {
    "LOG_LEVEL"         = { value = "error" },
    "DOWNLOAD_TEMP_DIR" = { value = "${local.mount_path}/tmp" },
    "DB_SCHEMA_VERSION" = { value = var.db_schema_version },
    "LABEL_SET_ID"      = { value = var.label_set_id },
    "LABEL_SET_VERSION" = { value = var.label_set_version }
  }

}
