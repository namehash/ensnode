locals {
  # Default Railway environment name. Used also for DNS records creation for ENSIndexers and ENSRainbow
  default_environment = "terraform-test"
  # Domain name Used for DNS records creation for ENSIndexers and ENSRainbow
  # DNS records are named following given naming pattern indexer.${default_environment}.${domain_name}
  # Example indexer.holesky.terraform-test.ensnode.io
  domain_name         = "ensnode.io"
  # US East Metal - Railway regions: https://docs.railway.com/reference/regions
  railway_region         = "us-east4-eqdc4a"
  heal_reverse_addresses = "false"
  active_plugins         = "subgraph"
  ens_deployment_chain   = "holesky"
}

resource "railway_project" "this" {
  name = "TerraformTest"
  default_environment = {
    name = local.default_environment
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
  domain_name            = local.domain_name
  subdomain_prefix         = "holesky.${local.default_environment}"
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
