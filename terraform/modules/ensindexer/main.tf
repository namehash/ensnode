locals {
  rpc_request_rate_limit = "1000"

  common_variables = {
    # Common configuration
    "DATABASE_URL"      = { value = var.ensdb_url },
    "DATABASE_SCHEMA"   = { value = var.database_schema },
    "ENSRAINBOW_URL"    = { value = var.ensrainbow_url },
    "LABEL_SET_ID"      = { value = var.ensindexer_label_set_id },
    "LABEL_SET_VERSION" = { value = var.ensindexer_label_set_version },
    "PLUGINS"           = { value = var.plugins },
    "NAMESPACE"         = { value = var.namespace },
    "ENSADMIN_URL"      = { value = var.ensadmin_public_url },
    "SUBGRAPH_COMPAT"   = { value = var.subgraph_compat }

    # Mainnet networks
    "RPC_URL_1"                     = { value = var.ethereum_mainnet_rpc_url },
    "RPC_REQUEST_RATE_LIMIT_1"      = { value = local.rpc_request_rate_limit },
    "RPC_URL_8453"                  = { value = var.base_mainnet_rpc_url },
    "RPC_REQUEST_RATE_LIMIT_8453"   = { value = local.rpc_request_rate_limit },
    "RPC_URL_59144"                 = { value = var.linea_mainnet_rpc_url },
    "RPC_REQUEST_RATE_LIMIT_59144"  = { value = local.rpc_request_rate_limit },
    "RPC_URL_10"                    = { value = var.optimism_mainnet_rpc_url },
    "RPC_REQUEST_RATE_LIMIT_10"     = { value = local.rpc_request_rate_limit },
    "RPC_URL_42161"                 = { value = var.arbitrum_mainnet_rpc_url },
    "RPC_REQUEST_RATE_LIMIT_42161"  = { value = local.rpc_request_rate_limit },
    "RPC_URL_534352"                = { value = var.scroll_mainnet_rpc_url },
    "RPC_REQUEST_RATE_LIMIT_534352" = { value = local.rpc_request_rate_limit },

    # Sepolia networks
    "RPC_URL_11155111"                = { value = var.ethereum_sepolia_rpc_url },
    "RPC_REQUEST_RATE_LIMIT_11155111" = { value = local.rpc_request_rate_limit },
    "RPC_URL_84532"                   = { value = var.base_sepolia_rpc_url },
    "RPC_REQUEST_RATE_LIMIT_84532"    = { value = local.rpc_request_rate_limit },
    "RPC_URL_59141"                   = { value = var.linea_sepolia_rpc_url },
    "RPC_REQUEST_RATE_LIMIT_59141"    = { value = local.rpc_request_rate_limit },
    "RPC_URL_11155420"                = { value = var.optimism_sepolia_rpc_url },
    "RPC_REQUEST_RATE_LIMIT_11155420" = { value = local.rpc_request_rate_limit },
    "RPC_URL_421614"                  = { value = var.arbitrum_sepolia_rpc_url },
    "RPC_REQUEST_RATE_LIMIT_421614"   = { value = local.rpc_request_rate_limit },
    "RPC_URL_534351"                  = { value = var.scroll_sepolia_rpc_url },
    "RPC_REQUEST_RATE_LIMIT_534351"   = { value = local.rpc_request_rate_limit },

    # Holesky networks
    "RPC_URL_17000"                = { value = var.ethereum_holesky_rpc_url },
    "RPC_REQUEST_RATE_LIMIT_17000" = { value = local.rpc_request_rate_limit },
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

  env_vars = merge(
    local.common_variables,
    {
      ENSNODE_PUBLIC_URL = {
        value = "https://${local.ensindexer_fqdn}"
      },
      ENSINDEXER_URL = {
        value = "http://ensindexer-${var.ensnode_indexer_type}:10000"
      }
    }
  )

  # See https://render.com/docs/custom-domains
  custom_domains = [
    { name : local.ensindexer_fqdn },
  ]

}

# For details on "render_web_service", see:
# https://registry.terraform.io/providers/render-oss/render/latest/docs/resources/web_service
resource "render_web_service" "ensindexer_api" {
  name           = "ensindexer_api_${var.ensnode_indexer_type}"
  plan           = "starter"
  region         = var.render_region
  environment_id = var.render_environment_id

  runtime_source = {
    image = {
      image_url = "ghcr.io/namehash/ensnode/ensindexer"
      tag       = var.ensnode_version
    }
  }

  env_vars = merge(
    local.common_variables,
    {
      ENSNODE_PUBLIC_URL = {
        value = "https://${local.ensindexer_api_fqdn}"
      },
      ENSINDEXER_URL = {
        value = "http://ensindexer-${var.ensnode_indexer_type}:10000"
      },
      PONDER_COMMAND = {
        value = "serve"
      }
    }
  )

  # See https://render.com/docs/custom-domains
  custom_domains = [
    { name : local.ensindexer_api_fqdn },
  ]

}
