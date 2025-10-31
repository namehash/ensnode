locals {
  common_variables = {
    # Common configuration
    "DATABASE_URL"    = { value = var.ensdb_url },
    "ALCHEMY_API_KEY" = { value = var.alchemy_api_key }
  }
}

# For details on "render_web_service", see:
# https://registry.terraform.io/providers/render-oss/render/latest/docs/resources/web_service
resource "render_web_service" "ensindexer" {
  name           = "ensindexer-${var.ensnode_indexer_type}"
  plan           = var.render_instance_plan
  region         = var.render_region
  environment_id = var.render_environment_id

  runtime_source = {
    image = {
      image_url = "ghcr.io/namehash/ensnode/ensindexer"
      tag       = var.ensnode_version
    }
  }

  env_vars = merge(locals.common_variables, {
    "DATABASE_SCHEMA"   = { value = var.database_schema },
    "ENSRAINBOW_URL"    = { value = var.ensrainbow_url },
    "LABEL_SET_ID"      = { value = var.ensindexer_label_set_id },
    "LABEL_SET_VERSION" = { value = var.ensindexer_label_set_version },
    "PLUGINS"           = { value = var.plugins },
    "NAMESPACE"         = { value = var.namespace },
    "SUBGRAPH_COMPAT"   = { value = var.subgraph_compat }
    "ENSINDEXER_URL"    = { value = "http://ensindexer-${var.ensnode_indexer_type}:10000" }
  })

  # See https://render.com/docs/custom-domains
  custom_domains = [
    { name : local.ensindexer_fqdn },
  ]

}

# For details on "render_web_service", see:
# https://registry.terraform.io/providers/render-oss/render/latest/docs/resources/web_service
resource "render_web_service" "ensapi" {
  name           = "ensapi_${var.ensnode_indexer_type}"
  plan           = "starter"
  region         = var.render_region
  environment_id = var.render_environment_id

  runtime_source = {
    image = {
      image_url = "ghcr.io/namehash/ensnode/ensapi"
      tag       = var.ensnode_version
    }
  }

  env_vars = merge(locals.common_variables, {
    "ENSINDEXER_URL" = { value = "http://ensindexer-${var.ensnode_indexer_type}:10000" }
  })

  # See https://render.com/docs/custom-domains
  custom_domains = [
    { name : local.ensapi_fqdn },
  ]
}
