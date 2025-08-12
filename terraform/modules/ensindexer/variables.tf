variable "render_environment_id" {
  type = string
}

variable "render_region" {
  type = string
}

variable "instance_type" {
  type = string
}

# DNS variables
variable "base_domain_name" {
  type        = string
  description = "Base DNS domain (e.g. 'example.com' or 'namehash.io'). Combine with subdomain_prefix to build full domain name."
}

variable "subdomain_prefix" {
  type        = string
  description = "Subdomain prefix (e.g. 'mainnet.green' or 'staging'). Combine with base_domain_name to build full domain name."
}

# ENSIndexer variables
variable "instance_name" {
  type        = string
  description = "Unique name for ensindexer to guarantee Render instance name uniqueness"
}

variable "database_url" {
  type = string
}
variable "ensnode_version" {
  type = string
}
variable "heal_reverse_addresses" {
  type = string
}
variable "index_additional_resolver_records" {
  type = string
}

variable "ensrainbow_url" {
  type = string
}
variable "database_schema" {
  type = string
}
variable "plugins" {
  type = string
}
variable "namespace" {
  type = string
}

variable "mainnet_rpc_url" {
  type = string
}

variable "sepolia_rpc_url" {
  type = string
}

variable "holesky_rpc_url" {
  type = string
}

variable "base_rpc_url" {
  type = string
}

variable "linea_rpc_url" {
  type = string
}

variable "optimism_rpc_url" {
  type = string
}

variable "base_sepolia_rpc_url" {
  type = string
}

variable "linea_sepolia_rpc_url" {
  type = string
}
variable "arbitrum_mainnet_rpc_url" {
  type = string
}
variable "scroll_mainnet_rpc_url" {
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
