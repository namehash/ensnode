
locals {
  # The `hosted_zone_name` represents the "base" domain name of the zone in DNS
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


  # ENSRainbow instances with their specific configurations.
  ensrainbow_instances = {
    # The Subgraph instance uses fixed label set ID "subgraph" and
    # fixed label set version "0".
    subgraph = {
      ensrainbow_label_set_id      = "subgraph"
      ensrainbow_label_set_version = "0"
      disk_size_gb                 = 50
    }

    # The Searchlight instance uses fixed label set ID "searchlight" and
    # configurable label set version.
    searchlight = {
      ensrainbow_label_set_id      = "searchlight"
      ensrainbow_label_set_version = var.ensrainbow_searchlight_label_set_version
      disk_size_gb                 = 100
    }
  }

  # ENSIndexer instances with their specific configurations.
  # Subgraph instances use the ENSRainbow Subgraph instance.
  # while Alpha-style and v2 instances use the ENSRainbow Searchlight instance.
  ensindexer_instances = {
    sepolia = {
      ensnode_indexer_type         = "sepolia"
      ensnode_environment_name     = var.render_environment
      database_schema              = "sepoliaSchema-${var.ensnode_version}"
      plugins                      = "subgraph"
      namespace                    = "sepolia"
      render_instance_plan         = "starter"
      subgraph_compat              = true
      ensindexer_label_set_id      = "subgraph"
      ensindexer_label_set_version = "0"
    }
    v2-sepolia = {
      ensnode_indexer_type         = "v2-sepolia"
      ensnode_environment_name     = var.render_environment
      database_schema              = "v2SepoliaSchema-${var.ensnode_version}"
      plugins                      = "ensv2,protocol-acceleration"
      namespace                    = "sepolia"
      render_instance_plan         = "starter"
      subgraph_compat              = false
      ensindexer_label_set_id      = "searchlight"
      ensindexer_label_set_version = var.ensrainbow_searchlight_label_set_version
    }
    mainnet = {
      ensnode_indexer_type         = "mainnet"
      ensnode_environment_name     = var.render_environment
      database_schema              = "mainnetSchema-${var.ensnode_version}"
      plugins                      = "subgraph"
      namespace                    = "mainnet"
      render_instance_plan         = "standard"
      subgraph_compat              = true
      ensindexer_label_set_id      = "subgraph"
      ensindexer_label_set_version = "0"
    }
    alpha = {
      ensnode_indexer_type         = "alpha"
      ensnode_environment_name     = var.render_environment
      database_schema              = "alphaSchema-${var.ensnode_version}"
      plugins                      = "subgraph,basenames,lineanames,threedns,protocol-acceleration,registrars,tokenscope"
      namespace                    = "mainnet"
      render_instance_plan         = "standard"
      subgraph_compat              = false
      ensindexer_label_set_id      = "searchlight"
      ensindexer_label_set_version = var.ensrainbow_searchlight_label_set_version
    }

    alpha-sepolia = {
      ensnode_indexer_type         = "alpha-sepolia"
      ensnode_environment_name     = var.render_environment
      database_schema              = "alphaSepoliaSchema-${var.ensnode_version}"
      plugins                      = "subgraph,basenames,lineanames,registrars"
      namespace                    = "sepolia"
      render_instance_plan         = "starter"
      subgraph_compat              = false
      ensindexer_label_set_id      = "searchlight"
      ensindexer_label_set_version = var.ensrainbow_searchlight_label_set_version
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

  for_each = local.ensrainbow_instances

  render_environment_id = render_project.ensnode.environments["default"].id
  render_region         = local.render_region
  disk_size_gb          = each.value.disk_size_gb
  ensnode_version       = var.ensnode_version

  # Label set that ENSRainbow will offer to its clients
  ensrainbow_label_set_id      = each.value.ensrainbow_label_set_id
  ensrainbow_label_set_version = each.value.ensrainbow_label_set_version
}

module "ensadmin" {
  source                = "./modules/ensadmin"
  render_region         = local.render_region
  render_environment_id = render_project.ensnode.environments["default"].id
  render_instance_plan  = "starter"

  hosted_zone_name                      = local.hosted_zone_name
  ensnode_version                       = var.ensnode_version
  ensnode_environment_name              = var.render_environment
  anthropic_api_key                     = var.anthropic_api_key
  next_public_server_connection_library = var.next_public_server_connection_library

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

  # Common configuration
  render_region           = local.render_region
  render_environment_id   = render_project.ensnode.environments["default"].id
  ensdb_url               = module.ensdb.internal_connection_string
  alchemy_api_key         = var.alchemy_api_key
  quicknode_api_key       = var.quicknode_api_key
  quicknode_endpoint_name = var.quicknode_endpoint_name

  # The "fully pinned" label set reference that ENSIndexer will request ENSRainbow use for deterministic label healing across time. This label set reference is "fully pinned" as it requires both the labelSetId and labelSetVersion fields to be defined.
  ensindexer_label_set_id      = each.value.ensindexer_label_set_id
  ensindexer_label_set_version = each.value.ensindexer_label_set_version

  # The internal URL to the relevant ENSRainbow service instance
  # that this ENSIndexer instance will use.
  # Note: Each ENSRainbow instance can be referenced by its label set ID,
  # as defined in local.ensrainbow_instances. Also, each ENSIndexer instance
  # defines which label set ID it is configured to use.
  # We use that label set ID config of an ENSIndexer instance to look up
  # the specific ENSRainbow module instance and extract its URL output.
  ensrainbow_url = module.ensrainbow[each.value.ensindexer_label_set_id].ensrainbow_url
}
