resource "render_web_service" "ensadmin" {
  name           = "ensadmin"
  plan           = var.instance_type
  region         = var.render_region
  environment_id = var.render_environment_id

  runtime_source = {
    image = {
      image_url = "ghcr.io/namehash/ensnode/ensadmin"
      tag       = var.ensnode_version
    }
  }

  env_vars = {
    ENSADMIN_PUBLIC_URL = {
      value = "https://${local.full_ensadmin_hostname}"
    }
  }

  custom_domains = [
    { name : local.full_ensadmin_hostname },
  ]

}
