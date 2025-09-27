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
  default = 250
}

# Mainnet Variables
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

# Sepolia Variables
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

# Holesky Variables
variable "ethereum_holesky_rpc_url" {
  type = string
}

# The "fully pinned" label set reference that ENSIndexer will request ENSRainbow use for deterministic label healing across time. This label set reference is "fully pinned" as it requires both the labelSetId and labelSetVersion fields to be defined.
variable "ensindexer_label_set_id" {
  type        = string
  description = "The label set ID that ENSIndexer will request from ENSRainbow for deterministic label healing. See https://ensnode.io/ensrainbow/concepts/glossary/#label-set-id-env for definition."
}

variable "ensindexer_label_set_version" {
  type        = string
  description = "The label set version that ENSIndexer will request from ENSRainbow for deterministic label healing. See https://ensnode.io/ensrainbow/concepts/glossary/#label-set-version-env for definition."
}

# Label set that ENSRainbow will offer to its clients
variable "ensrainbow_label_set_id" {
  type        = string
  description = "The label set ID that ENSRainbow will offer to its clients. See https://ensnode.io/ensrainbow/concepts/glossary/#label-set-id-env for definition."
}

variable "ensrainbow_label_set_version" {
  type        = string
  description = "The highest label set version that ENSRainbow will offer to its clients. See https://ensnode.io/ensrainbow/concepts/glossary/#label-set-version-env for definition."
}
