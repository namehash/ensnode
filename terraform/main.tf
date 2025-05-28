locals {
  # Default Railway environment name. Also influences the domain name for ENSIndexer and ENSRainbow.
  railway_environment = "terraform-test"
  # Base domain name used for ENSIndexer and ENSRainbow DNS records
  # DNS records for ENSIndexer are assigned using the following naming pattern indexer.${default_environment}.${domain_name}
  # Example indexer.holesky.terraform-test.ensnode.io
  base_domain_name = "ensnode.io"
  # US East Metal - Railway regions: https://docs.railway.com/reference/regions
  railway_region         = "us-east4-eqdc4a"
  heal_reverse_addresses = "false"
  active_plugins         = "subgraph"
  ens_deployment_chain   = "holesky"
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

module "holesky_ensindexer" {
  source     = "./modules/ensindexer"
  depends_on = [null_resource.health_check]
  #Indexer specific envs
  base_domain_name       = local.base_domain_name
  subdomain_prefix       = "holesky.${local.railway_environment}"
  ensnode_version        = var.ensnode_version
  heal_reverse_addresses = local.heal_reverse_addresses
  ensrainbow_url         = "http://$${{${railway_service.ensrainbow.name}.RAILWAY_PRIVATE_DOMAIN}}:8080"
  database_schema        = "holeskySchema-${var.ensnode_version}"
  active_plugins         = local.active_plugins
  ens_deployment_chain   = local.ens_deployment_chain
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

module "sepolia_ensindexer" {
  source     = "./modules/ensindexer"
  depends_on = [null_resource.health_check]
  #Indexer specific envs
  base_domain_name       = local.base_domain_name
  subdomain_prefix       = "sepolia.${local.railway_environment}"
  ensnode_version        = var.ensnode_version
  heal_reverse_addresses = local.heal_reverse_addresses
  ensrainbow_url         = "http://$${{${railway_service.ensrainbow.name}.RAILWAY_PRIVATE_DOMAIN}}:8080"
  database_schema        = "sepoliaSchema-${var.ensnode_version}"
  active_plugins         = local.active_plugins
  ens_deployment_chain   = local.ens_deployment_chain
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

module "mainnet_ensindexer" {
  source     = "./modules/ensindexer"
  depends_on = [null_resource.health_check]
  #Indexer specific envs
  base_domain_name       = local.base_domain_name
  subdomain_prefix       = "mainnet.${local.railway_environment}"
  ensnode_version        = var.ensnode_version
  heal_reverse_addresses = local.heal_reverse_addresses
  ensrainbow_url         = "http://$${{${railway_service.ensrainbow.name}.RAILWAY_PRIVATE_DOMAIN}}:8080"
  database_schema        = "mainnetSchema-${var.ensnode_version}"
  active_plugins         = local.active_plugins
  ens_deployment_chain   = local.ens_deployment_chain
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

module "alpha_ensindexer" {
  source     = "./modules/ensindexer"
  depends_on = [null_resource.health_check]
  #Indexer specific envs
  base_domain_name       = local.base_domain_name
  subdomain_prefix       = "alpha.${local.railway_environment}"
  ensnode_version        = var.ensnode_version
  heal_reverse_addresses = local.heal_reverse_addresses
  ensrainbow_url         = "http://$${{${railway_service.ensrainbow.name}.RAILWAY_PRIVATE_DOMAIN}}:8080"
  database_schema        = "alphaSchema-${var.ensnode_version}"
  active_plugins         = local.active_plugins
  ens_deployment_chain   = local.ens_deployment_chain
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
