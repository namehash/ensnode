locals {
  rpc_request_rate_limit = "1000"

  common_variables = {
    # Common configuration
    "DATABASE_URL"                      = { value = var.database_url },
    "DATABASE_SCHEMA"                   = { value = var.database_schema },
    "ENSRAINBOW_URL"                    = { value = var.ensrainbow_url },
    "PLUGINS"                           = { value = var.plugins },
    "NAMESPACE"                         = { value = var.namespace },
    "INDEX_ADDITIONAL_RESOLVER_RECORDS" = { value = var.index_additional_resolver_records },
    "HEAL_REVERSE_ADDRESSES"            = { value = var.heal_reverse_addresses },

    # Mainnet networks
    "RPC_URL_1"                     = { value = var.etherum_mainnet_rpc_url },
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
    "RPC_URL_11155111"                = { value = var.etherum_sepolia_rpc_url },
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
    "RPC_URL_17000"                = { value = var.etherum_holesky_rpc_url },
    "RPC_REQUEST_RATE_LIMIT_17000" = { value = local.rpc_request_rate_limit },
  }
}

resource "render_web_service" "ensindexer" {
  name           = "ensindexer_${var.instance_name}"
  plan           = var.instance_type
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
        value = "https://${local.full_ensindexer_hostname}"
      }
    }
  )
  custom_domains = [
    { name : local.full_ensindexer_hostname },
  ]

}


resource "render_web_service" "ensindexer_api" {
  name           = "ensindexer_api_${var.instance_name}"
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
        value = "https://${local.full_ensindexer_api_hostname}"

      },
      PONDER_COMMAND = {
        value = "serve"
      }
    }
  )
  custom_domains = [
    { name : local.full_ensindexer_api_hostname },
  ]

}
