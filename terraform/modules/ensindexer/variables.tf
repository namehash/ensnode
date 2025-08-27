# ENSNode configuration
variable "ensnode_version" {
  type = string
}

# Render configuration
variable "render_environment_id" {
  type = string
}

variable "render_region" {
  type = string
}

variable "instance_type" {
  type = string
}

# DNS configuration
variable "base_domain_name" {
  type        = string
  description = "Base DNS domain (e.g. 'example.com' or 'namehash.io'). Combine with subdomain_prefix to build full domain name."
}

variable "subdomain_prefix" {
  type        = string
  description = "Subdomain prefix (e.g. 'mainnet.green' or 'staging'). Combine with base_domain_name to build full domain name."
}

# ENSIndexer configuration
variable "instance_name" {
  type        = string
  description = "Unique name for ensindexer instance to guarantee unique names for all Render instances"
}

variable "database_url" {
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

variable "heal_reverse_addresses" {
  type = string
}

variable "index_additional_resolver_records" {
  type = string
}

variable "replace_unnormalized" {
  type = string
}

# Mainnet RPC URLs
variable "ethereum_mainnet_rpc_url" {
  type = string
}

variable "base_mainnet_rpc_url" {
  type = string
}

variable "linea_mainnet_rpc_url" {
  type = string
}

variable "optimism_mainnet_rpc_url" {
  type = string
}

variable "arbitrum_mainnet_rpc_url" {
  type = string
}

variable "scroll_mainnet_rpc_url" {
  type = string
}

# Sepolia RPC URLs
variable "ethereum_sepolia_rpc_url" {
  type = string
}

variable "base_sepolia_rpc_url" {
  type = string
}

variable "linea_sepolia_rpc_url" {
  type = string
}

variable "optimism_sepolia_rpc_url" {
  type = string
}

variable "arbitrum_sepolia_rpc_url" {
  type = string
}

variable "scroll_sepolia_rpc_url" {
  type = string
}

# Holesky RPC URLs
variable "ethereum_holesky_rpc_url" {
  type = string
}
