# General Variables
variable "ensnode_version" {
  type = string
}

variable "render_api_key" {
  type = string
}

variable "render_environment" {
  type = string
}

variable "render_owner_id" {
  type = string
}

variable "ensdb_disk_size_gb" {
  type    = number
  default = 120
}

# Mainnet Variables
variable "etherum_mainnet_rpc_url" {
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

# Sepolia Variables
variable "etherum_sepolia_rpc_url" {
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

# Holesky Variables
variable "etherum_holesky_rpc_url" {
  type = string
}
