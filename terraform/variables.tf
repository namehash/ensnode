# ENSNode configuration
variable "ensnode_version" {
  type = string
}

variable "anthropic_api_key" {
  type    = string
  default = null
}

# General Variables
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
  default = 255
}

# ENSNode Variables

variable "alchemy_api_key" {
  type = string
}

variable "quicknode_api_key" {
  type = string
}

variable "quicknode_endpoint_name" {
  type = string
}

# Label set version that ENSRainbow Searchlight will offer to its clients
variable "ensrainbow_searchlight_label_set_version" {
  type        = string
  description = "Label set version that ENSRainbow Searchlight will offer to its clients. See https://ensnode.io/ensrainbow/concepts/glossary/#label_set_version for definition."
}
