locals {
  # Default Railway environment name. Also influences the domain name for ENSIndexer and ENSRainbow.
  railway_environment = "terraform-test"
  # Base domain name used for ENSIndexer and ENSRainbow DNS records
  # DNS records for ENSIndexer are assigned using the following naming pattern indexer.${default_environment}.${domain_name}
  # Example indexer.holesky.terraform-test.ensnode.io
  base_domain_name = "ensnode.io"
  # US East Metal - Railway regions: https://docs.railway.com/reference/regions
  railway_region = "us-east4-eqdc4a"
  ensindexer_instances = {
    holesky = {
      instance_name                     = "holesky"
      subdomain_prefix                  = "holesky.${local.railway_environment}"
      database_schema                   = "holeskySchema-${var.ensnode_version}"
      active_plugins                    = "subgraph"
      l1_chain                          = "holesky"
      heal_reverse_addresses            = "false"
      index_additional_resolver_records = "false"
    }
    sepolia = {
      instance_name                     = "sepolia"
      subdomain_prefix                  = "sepolia.${local.railway_environment}"
      database_schema                   = "sepoliaSchema-${var.ensnode_version}"
      active_plugins                    = "subgraph"
      l1_chain                          = "sepolia"
      heal_reverse_addresses            = "false"
      index_additional_resolver_records = "false"
    }
    mainnet = {
      instance_name                     = "mainnet"
      subdomain_prefix                  = "mainnet.${local.railway_environment}"
      database_schema                   = "mainnetSchema-${var.ensnode_version}"
      active_plugins                    = "subgraph"
      l1_chain                          = "mainnet"
      heal_reverse_addresses            = "false"
      index_additional_resolver_records = "false"
    }
    alpha = {
      instance_name                     = "alpha"
      subdomain_prefix                  = "alpha.${local.railway_environment}"
      database_schema                   = "alphaSchema-${var.ensnode_version}"
      active_plugins                    = "subgraph,basenames,lineanames,threedns"
      l1_chain                          = "mainnet"
      heal_reverse_addresses            = "true"
      index_additional_resolver_records = "true"
    }
  }
}

resource "railway_project" "this" {
  name = "TerraformTest"
  default_environment = {
    name = local.railway_environment
  }
}

module "database" {
  source                 = "./modules/database"
  railway_region         = local.railway_region
  railway_token          = var.railway_token
  railway_project_id     = railway_project.this.id
  railway_environment_id = railway_project.this.default_environment.id
}

module "ensindexer" {
  source   = "./modules/ensindexer"
  for_each = local.ensindexer_instances

  depends_on = [null_resource.health_check]
  # Instance-specific configuration
  instance_name                     = each.value.instance_name
  subdomain_prefix                  = each.value.subdomain_prefix
  database_schema                   = each.value.database_schema
  active_plugins                    = each.value.active_plugins
  l1_chain                          = each.value.l1_chain
  heal_reverse_addresses            = each.value.heal_reverse_addresses
  index_additional_resolver_records = each.value.index_additional_resolver_records

  # Common configuration (spread operator merges the map)
  base_domain_name = local.base_domain_name
  ensnode_version  = var.ensnode_version
  ensrainbow_url   = "http://$${{${railway_service.ensrainbow.name}.RAILWAY_PRIVATE_DOMAIN}}:8080"

  #Common envs
  railway_region         = local.railway_region
  railway_token          = var.railway_token
  railway_project_id     = railway_project.this.id
  railway_environment_id = railway_project.this.default_environment.id
  database_url           = "$${{${module.database.database_instance_name}.DATABASE_URL}}"
  mainnet_rpc_url        = var.mainnet_rpc_url
  sepolia_rpc_url        = var.sepolia_rpc_url
  linea_rpc_url          = var.linea_rpc_url
  holesky_rpc_url        = var.holesky_rpc_url
  base_rpc_url           = var.base_rpc_url
  optimism_rpc_url       = var.optimism_rpc_url
}
