
locals {
  # Base domain name used for ENSIndexer and ENSRainbow DNS records
  # DNS records for ENSIndexer are assigned using the following naming pattern indexer.${default_environment}.${domain_name}
  # Example indexer.holesky.terraform-test.ensnode.io
  base_domain_name = "ensnode.io"
  render_region    = "ohio"
  ensindexer_instances = {
    holesky = {
      instance_name                     = "holesky"
      subdomain_prefix                  = "holesky.${var.render_environment}"
      database_schema                   = "holeskySchema-${var.ensnode_version}"
      plugins                           = "subgraph"
      namespace                         = "holesky"
      heal_reverse_addresses            = "false"
      index_additional_resolver_records = "false"
      instance_type                     = "starter"
    }
    sepolia = {
      instance_name                     = "sepolia"
      subdomain_prefix                  = "sepolia.${var.render_environment}"
      database_schema                   = "sepoliaSchema-${var.ensnode_version}"
      plugins                           = "subgraph"
      namespace                         = "sepolia"
      heal_reverse_addresses            = "false"
      index_additional_resolver_records = "false"
      instance_type                     = "starter"
    }
    mainnet = {
      instance_name                     = "mainnet"
      subdomain_prefix                  = "mainnet.${var.render_environment}"
      database_schema                   = "mainnetSchema-${var.ensnode_version}"
      plugins                           = "subgraph"
      namespace                         = "mainnet"
      heal_reverse_addresses            = "false"
      index_additional_resolver_records = "false"
      instance_type                     = "standard"
    }
    alpha = {
      instance_name                     = "alpha"
      subdomain_prefix                  = "alpha.${var.render_environment}"
      database_schema                   = "alphaSchema-${var.ensnode_version}"
      plugins                           = "subgraph,basenames,lineanames,threedns,reverse-resolvers,referrals,tokenscope"
      namespace                         = "mainnet"
      heal_reverse_addresses            = "true"
      index_additional_resolver_records = "true"
      instance_type                     = "standard"
    }

    alpha-sepolia = {
      instance_name                     = "alpha-sepolia"
      subdomain_prefix                  = "alpha-sepolia.${var.render_environment}"
      database_schema                   = "alphaSepoliaSchema-${var.ensnode_version}"
      plugins                           = "subgraph,basenames,lineanames,reverse-resolvers,referrals,tokenscope"
      namespace                         = "sepolia"
      heal_reverse_addresses            = "true"
      index_additional_resolver_records = "true"
      instance_type                     = "starter"
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

module "ensindexer" {
  source   = "./modules/ensindexer"
  for_each = local.ensindexer_instances

  # Instance-specific configuration
  instance_name                     = each.value.instance_name
  instance_type                     = each.value.instance_type
  subdomain_prefix                  = each.value.subdomain_prefix
  database_schema                   = each.value.database_schema
  plugins                           = each.value.plugins
  namespace                         = each.value.namespace
  heal_reverse_addresses            = each.value.heal_reverse_addresses
  index_additional_resolver_records = each.value.index_additional_resolver_records

  # Common configuration (spread operator merges the map)
  base_domain_name = local.base_domain_name
  ensnode_version  = var.ensnode_version
  ensrainbow_url   = module.ensrainbow.ensrainbow_url

  # Common configuration
  render_region         = local.render_region
  render_environment_id = render_project.ensnode.environments["default"].id
  database_url          = module.ensdb.internal_connection_string

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
