locals {
  environment = var.ensnode_environment_name
  zone        = var.hosted_zone_name
  base_domain = "${local.environment}.${local.zone}"

  api_variants = {
    alpha          = "api.alpha"
    alpha-sepolia  = "api.alpha-sepolia"
    v2-sepolia     = "api.v2-sepolia"
    mainnet        = "api.mainnet"
    sepolia        = "api.sepolia"
  }

  api_fqdns = {
    for name, prefix in local.api_variants :
    name => "${prefix}.${local.base_domain}"
  }

  ensadmin_fqdn = "admin.${local.base_domain}"
}

resource "render_web_service" "ensadmin" {
  name           = "ensadmin"
  plan           = var.render_instance_plan
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
      value = "https://${local.ensadmin_fqdn}"
    }
    ANTHROPIC_API_KEY = {
      value = var.anthropic_api_key
    }
    NEXT_PUBLIC_SERVER_CONNECTION_LIBRARY = {
      value = join(",", [
        for fqdn in values(local.api_fqdns) : "https://${fqdn}"
      ])
    }
  }

  custom_domains = [
    { name = local.ensadmin_fqdn }
  ]
}
