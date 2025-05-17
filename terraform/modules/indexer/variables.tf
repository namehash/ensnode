variable "railway_token" {
  type = string
  description = "API token generated for account workspace. Visit https://railway.com/account/tokens"
}

variable "railway_project_id" {
  type = string
}

variable "railway_environment_id" {
  type = string
}

variable "domain_name" {
  type = string
}

variable "subdomain_name" {
  type = string
}

variable "database_url" {
  type = string
}
variable "ens_indexer_version" {
  type = string
}
variable "heal_reverse_addresses" {
  type = string
}

variable "ensrainbow_url" {
  type = string
}
variable "database_schema" {
  type = string
}
variable "active_plugins" {
  type = string
}
variable "deployment_chain" {
  type = string
}

variable "railway_region" {
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
