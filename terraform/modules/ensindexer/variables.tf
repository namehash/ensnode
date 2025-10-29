# Render configuration

# See https://render.com/docs/projects
variable "render_environment_id" {
  type = string
}

# See https://render.com/docs/blueprint-spec#region
variable "render_region" {
  type = string
}

# See https://render.com/docs/web-services
variable "render_instance_plan" {
  type = string
}

# DNS configuration

# Example: "ensnode.io"
# See main.tf for more details
variable "hosted_zone_name" {
  type = string
}

# Example: "blue"
# See main.tf for more details on how this is used, including for building fqdn values.
variable "ensnode_environment_name" {
  type = string
}

# Example: "alpha-sepolia"
# See main.tf for more details on how this is used, including for building fqdn values.
variable "ensnode_indexer_type" {
  type = string
}

# ENSIndexer configuration

variable "ensnode_version" {
  type = string
}

variable "ensdb_url" {
  type = string
}

variable "database_schema" {
  type = string
}

variable "ensrainbow_url" {
  type = string
}

variable "ensindexer_label_set_id" {
  type        = string
  description = "The label set ID that ENSIndexer will request from ENSRainbow for deterministic label healing (e.g., 'subgraph', 'ens-test-env')"
}

variable "ensindexer_label_set_version" {
  type        = string
  description = "The label set version that ENSIndexer will request from ENSRainbow for deterministic label healing (e.g., '0', '1')"
}

variable "plugins" {
  type = string
}

variable "namespace" {
  type = string
}

variable "subgraph_compat" {
  type = bool
}

variable "alchemy_api_key" {
  type = string
}
