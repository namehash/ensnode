variable "render_api_key" {
  type = string
}

variable "render_environment" {
  type = string
}

variable "render_owner_id" {
  type = string
}

variable "ensnode_version" {
  type = string
}

variable "ensdb_disk_size_gb" {
  type    = number
  default = 120
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
