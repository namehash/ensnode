
locals {
  # The `hosted_zone_name` represents the "base" domain name of the zone in AWS Route53
  # where "hosted" ENSNode app instances (such as ENSIndexer and ENSRainbow) are nested beneath.
  #
  # For example, if:
  # - `hosted_zone_name` is "ensnode.io"
  # - `ensnode_environment_name` is "blue"
  # - `ensnode_indexer_type` is "alpha-sepolia"
  #
  # The fqdn for "API"-style ENSIndexer instances is generated as follows:
  # - api.${var.ensnode_indexer_type}.${var.ensnode_environment_name}.${var.hosted_zone_name}
  # - example: api.alpha-sepolia.blue.ensnode.io
  #
  # The fqdn for "Indexer"-style ENSIndexer instances is generated as follows:
  # - indexer.${var.ensnode_indexer_type}.${var.ensnode_environment_name}.${var.hosted_zone_name}
  # - example: indexer.alpha-sepolia.blue.ensnode.io
  hosted_zone_name = "ensnode.io"
  # See https://render.com/docs/blueprint-spec#region
  render_region = "ohio"
  ensindexer_instances = {
    holesky = {
      ensnode_indexer_type     = "holesky"
      ensnode_environment_name = var.render_environment
      database_schema          = "holeskySchema-${var.ensnode_version}"
      plugins                  = "subgraph"
      namespace                = "holesky"
      render_instance_plan     = "starter"
      subgraph_compat          = true
    }
    sepolia = {
      ensnode_indexer_type     = "sepolia"
      ensnode_environment_name = var.render_environment
      database_schema          = "sepoliaSchema-${var.ensnode_version}"
      plugins                  = "subgraph"
      namespace                = "sepolia"
      render_instance_plan     = "starter"
      subgraph_compat          = true
    }
    mainnet = {
      ensnode_indexer_type     = "mainnet"
      ensnode_environment_name = var.render_environment
      database_schema          = "mainnetSchema-${var.ensnode_version}"
      plugins                  = "subgraph"
      namespace                = "mainnet"
      render_instance_plan     = "standard"
      subgraph_compat          = true
    }
    alpha = {
      ensnode_indexer_type     = "alpha"
      ensnode_environment_name = var.render_environment
      database_schema          = "alphaSchema-${var.ensnode_version}"
      plugins                  = "subgraph,basenames,lineanames,threedns,reverse-resolvers,referrals,tokenscope"
      namespace                = "mainnet"
      render_instance_plan     = "standard"
      subgraph_compat          = false
    }

    alpha-sepolia = {
      ensnode_indexer_type     = "alpha-sepolia"
      ensnode_environment_name = var.render_environment
      database_schema          = "alphaSepoliaSchema-${var.ensnode_version}"
      plugins                  = "subgraph,basenames,lineanames,reverse-resolvers,referrals"
      namespace                = "sepolia"
      render_instance_plan     = "starter"
      subgraph_compat          = false
    }
  }
}

resource "render_project" "ensnode" {
  name = "ENSNode-${var.render_environment}"
  environments = {
    "default" : {
      name : var.render_environment,
      # https://render.com/docs/projects#protected-environments
      # "unprotected" allows all Render team members (not just admins) to make destructive changes to designated resources
      protected_status : "unprotected"
    }
  }
}

module "ensdb" {
  source = "./modules/ensdb"

  render_environment_id = render_project.ensnode.environments["default"].id
  render_region         = local.render_region
  disk_size_gb          = var.ensdb_disk_size_gb
}

module "ensrainbow" {
  source = "./modules/ensrainbow"

  render_environment_id = render_project.ensnode.environments["default"].id
  render_region         = local.render_region
  ensnode_version       = var.ensnode_version

  # Label set that ENSRainbow will offer to its clients
  ensrainbow_label_set_id      = var.ensrainbow_label_set_id
  ensrainbow_label_set_version = var.ensrainbow_label_set_version
}

module "ensadmin" {
  source                = "./modules/ensadmin"
  render_region         = local.render_region
  render_environment_id = render_project.ensnode.environments["default"].id
  render_instance_plan  = "starter"

  hosted_zone_name         = local.hosted_zone_name
  ensnode_version          = var.ensnode_version
  ensnode_environment_name = var.render_environment
  anthropic_api_key        = var.anthropic_api_key

  # NEXT_PUBLIC_SERVER_CONNECTION_LIBRARY is not currently configurable through
  # Docker due to this known issue: https://github.com/namehash/ensnode/issues/1037
}

module "ensindexer" {
  source   = "./modules/ensindexer"
  for_each = local.ensindexer_instances

  # Instance-specific configuration
  ensnode_indexer_type     = each.value.ensnode_indexer_type
  render_instance_plan     = each.value.render_instance_plan
  ensnode_environment_name = each.value.ensnode_environment_name
  database_schema          = each.value.database_schema
  plugins                  = each.value.plugins
  namespace                = each.value.namespace
  subgraph_compat          = each.value.subgraph_compat

  # Common configuration (spread operator merges the map)
  hosted_zone_name = local.hosted_zone_name
  ensnode_version  = var.ensnode_version
  ensrainbow_url   = module.ensrainbow.ensrainbow_url

  # Common configuration
  render_region         = local.render_region
  render_environment_id = render_project.ensnode.environments["default"].id
  ensdb_url             = module.ensdb.internal_connection_string
  ensadmin_public_url   = module.ensadmin.ensadmin_public_url

  # Mainnet RPC URLs
  ethereum_mainnet_rpc_url = var.ethereum_mainnet_rpc_url
  base_mainnet_rpc_url     = var.base_mainnet_rpc_url
  linea_mainnet_rpc_url    = var.linea_mainnet_rpc_url
  optimism_mainnet_rpc_url = var.optimism_mainnet_rpc_url
  arbitrum_mainnet_rpc_url = var.arbitrum_mainnet_rpc_url
  scroll_mainnet_rpc_url   = var.scroll_mainnet_rpc_url

  # Sepolia RPC URLs
  ethereum_sepolia_rpc_url = var.ethereum_sepolia_rpc_url
  base_sepolia_rpc_url     = var.base_sepolia_rpc_url
  linea_sepolia_rpc_url    = var.linea_sepolia_rpc_url
  optimism_sepolia_rpc_url = var.optimism_sepolia_rpc_url
  arbitrum_sepolia_rpc_url = var.arbitrum_sepolia_rpc_url
  scroll_sepolia_rpc_url   = var.scroll_sepolia_rpc_url

  # Holesky RPC URLs
  ethereum_holesky_rpc_url = var.ethereum_holesky_rpc_url

  # The "fully pinned" label set reference that ENSIndexer will request ENSRainbow use for deterministic label healing across time. This label set reference is "fully pinned" as it requires both the labelSetId and labelSetVersion fields to be defined.
  ensindexer_label_set_id      = var.ensindexer_label_set_id
  ensindexer_label_set_version = var.ensindexer_label_set_version
}
