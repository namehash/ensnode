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

# Deterministically pinned label set that ENSIndexer will request from ENSRainbow
variable "ensindexer_label_set_id" {
  type        = string
  description = "The label set ID that ENSIndexer will request from ENSRainbow for deterministic label healing (e.g., 'subgraph', 'ens-test-env')"
}

variable "ensindexer_label_set_version" {
  type        = string
  description = "The label set version that ENSIndexer will request from ENSRainbow for deterministic label healing (e.g., '0', '1')"
}

# Label set configuration for ENSRainbow itself
variable "ensrainbow_label_set_id" {
  type        = string
  description = "The label set ID that ENSRainbow will use for its own operations (e.g., 'subgraph', 'ens-test-env')"
}

variable "ensrainbow_label_set_version" {
  type        = string
  description = "The label set version that ENSRainbow will use for its own operations (e.g., '0', '1')"
}
