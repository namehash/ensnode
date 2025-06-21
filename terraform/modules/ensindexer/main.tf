locals {
  application_port       = 80
  rpc_request_rate_limit = "1000"
  rpc_url_1              = var.mainnet_rpc_url
  rpc_url_17000          = var.holesky_rpc_url
  rpc_url_8453           = var.base_rpc_url
  rpc_url_59144          = var.linea_rpc_url
  rpc_url_11155111       = var.sepolia_rpc_url
  rpc_url_10             = var.optimism_rpc_url
  common_variables = [
    {
      name  = "DATABASE_URL"
      value = var.database_url
    },
    {
      name  = "RPC_REQUEST_RATE_LIMIT_1"
      value = local.rpc_request_rate_limit
    },
    {
      name  = "RPC_REQUEST_RATE_LIMIT_59144"
      value = local.rpc_request_rate_limit
    },
    {
      name  = "RPC_REQUEST_RATE_LIMIT_8453"
      value = local.rpc_request_rate_limit
    },
    {
      name  = "RPC_REQUEST_RATE_LIMIT_17000"
      value = local.rpc_request_rate_limit
    },
    {
      name  = "RPC_REQUEST_RATE_LIMIT_10"
      value = local.rpc_request_rate_limit
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
      name  = "RPC_URL_10"
      value = local.rpc_url_10
    },
    {
      name  = "RPC_URL_11155111"
      value = local.rpc_url_11155111
    },
    {
      name  = "ENSNODE_PUBLIC_URL"
      value = "https://${local.full_ensindexer_hostname}"
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
      name  = "ENS_NAMESPACE"
      value = var.ens_namespace
    },
    {
      name  = "HEAL_REVERSE_ADDRESSES"
      value = var.heal_reverse_addresses
    },
    {
      name  = "INDEX_ADDITIONAL_RESOLVER_RECORDS"
      value = var.index_additional_resolver_records
    },
    {
      name  = "PORT"
      value = local.application_port
    }
  ]
}

resource "railway_service" "ensindexer" {
  name         = "ensindexer_${var.instance_name}"
  source_image = "ghcr.io/namehash/ensnode/ensindexer:${var.ensnode_version}"
  project_id   = var.railway_project_id
  region       = var.railway_region
}

# Instance of ENSIndexer started in Ponder's "serve" mode. This mode causes the ENSIndexer instance to skip the execution of any indexing logic and instead to exclusively focus on the responsibility of serving the main "public-facing" API endpoints for the overall ENSNode deployment.
# This division of "start" vs "serve" responsibilities between ENSIndexer instances ensures API availability continues uninterrupted for the overall ENSNode deployment through ensnode-api even if an indexing error in ensindexer causes it to crash.
# The following docs explain more about Ponder's "start" vs "serve" modes: https://ponder.sh/docs/api-reference/ponder-cli#serve.
resource "railway_service" "ensindexer_api" {
  name         = "ensindexer_api_${var.instance_name}"
  source_image = "ghcr.io/namehash/ensnode/ensindexer:${var.ensnode_version}"
  project_id   = var.railway_project_id
  region       = var.railway_region
}

resource "railway_variable_collection" "ensindexer" {
  environment_id = var.railway_environment_id
  service_id     = railway_service.ensindexer.id
  variables      = local.common_variables
}

# The following block of code defines the same set of variables as ensindexer, with the addition of the "PONDER_COMMAND" variable set to "serve".
resource "railway_variable_collection" "ensindexer_api" {
  environment_id = var.railway_environment_id
  service_id     = railway_service.ensindexer_api.id
  variables      = concat(local.common_variables, [{ name = "PONDER_COMMAND", value = "serve" }])
}
