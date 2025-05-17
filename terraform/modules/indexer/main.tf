locals {
  application_port   = 80
  request_rate_limit = "1000"
  rpc_url_1          = var.mainnet_rpc_url
  rpc_url_17000      = var.holesky_rpc_url
  rpc_url_8453       = var.base_rpc_url
  rpc_url_59144      = var.linea_rpc_url
  rpc_url_11155111   = var.sepolia_rpc_url
}

resource "railway_service" "ensindexer" {
  name         = "ensindexer"
  source_image = "ghcr.io/namehash/ensnode/ensindexer:${var.ens_indexer_version}"
  railway_project_id   = var.railway_project_id
  region = var.railway_region
}

resource "railway_service" "indexer_api" {
  name         = "indexer_api"
  source_image = "ghcr.io/namehash/ensnode/ensindexer:${var.ens_indexer_version}"
  railway_project_id   = var.railway_project_id
  region = var.railway_region
}

resource "railway_variable_collection" "ensindexer" {
  railway_environment_id = var.railway_environment_id
  service_id     = railway_service.ensindexer.id

  variables = [
    {
      name  = "DATABASE_URL"
      value = var.database_url
    },
    {
      name  = "RPC_REQUEST_RATE_LIMIT_1"
      value = local.request_rate_limit
    },
    {
      name  = "RPC_REQUEST_RATE_LIMIT_59144"
      value = local.request_rate_limit
    },
    {
      name  = "RPC_REQUEST_RATE_LIMIT_8453"
      value = local.request_rate_limit
    },
    {
      name  = "RPC_URL_1"
      value = local.rpc_url_1
    },
    {
      name  = "RPC_URL_59144"
      value = local.rpc_url_59144
    },
    {
      name  = "RPC_URL_8453"
      value = local.rpc_url_8453
    },
    {
      name  = "RPC_URL_17000"
      value = local.rpc_url_17000
    },
    {
      name  = "ENSNODE_PUBLIC_URL"
      value = "https://${local.indexer_domain}"
    },
    {
      name  = "ENSRAINBOW_URL"
      value = var.ensrainbow_url
    },
    {
      name  = "DATABASE_SCHEMA"
      value = var.database_schema
    },
    {
      name  = "ACTIVE_PLUGINS"
      value = var.active_plugins
    },
    {
      name  = "ENS_DEPLOYMENT_CHAIN"
      value = var.deployment_chain
    },
    {
      name  = "HEAL_REVERSE_ADDRESSES"
      value = var.heal_reverse_addresses
    },
    {
      name  = "PORT"
      value = local.application_port
    }
  ]
}


resource "railway_variable_collection" "api" {
  railway_environment_id = var.railway_environment_id
  service_id     = railway_service.indexer_api.id

  variables = [
    {
      name  = "DATABASE_URL"
      value = var.database_url
    },
    {
      name  = "RPC_REQUEST_RATE_LIMIT_1"
      value = local.request_rate_limit
    },
    {
      name  = "RPC_REQUEST_RATE_LIMIT_59144"
      value = local.request_rate_limit
    },
    {
      name  = "RPC_REQUEST_RATE_LIMIT_8453"
      value = local.request_rate_limit
    },
    {
      name  = "RPC_URL_1"
      value = local.rpc_url_1
    },
    {
      name  = "RPC_URL_59144"
      value = local.rpc_url_59144
    },
    {
      name  = "RPC_URL_8453"
      value = local.rpc_url_8453
    },
    {
      name  = "RPC_URL_17000"
      value = local.rpc_url_17000
    },
    {
      name  = "ENSNODE_PUBLIC_URL"
      value = "https://${local.api_domain}"
    },
    {
      name  = "ENSRAINBOW_URL"
      value = var.ensrainbow_url
    },
    {
      name  = "DATABASE_SCHEMA"
      value = var.database_schema
    },
    {
      name  = "ACTIVE_PLUGINS"
      value = var.active_plugins
    },
    {
      name  = "ENS_DEPLOYMENT_CHAIN"
      value = var.deployment_chain
    },
    {
      name  = "HEAL_REVERSE_ADDRESSES"
      value = var.heal_reverse_addresses
    },
    {
      name  = "PORT"
      value = local.application_port
    }
  ]
}
