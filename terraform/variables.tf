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
  default = 250
}

# ENSNode Variables

variable "alchemy_api_key" {
  type = string
}

# The "fully pinned" label set reference that ENSIndexer will request ENSRainbow use for deterministic label healing across time. This label set reference is "fully pinned" as it requires both the labelSetId and labelSetVersion fields to be defined.
variable "ensindexer_label_set_id" {
  type        = string
  description = "The label set ID that ENSIndexer will request from ENSRainbow for deterministic label healing. See https://ensnode.io/ensrainbow/concepts/glossary/#label_set_id for definition."
}

variable "ensindexer_label_set_version" {
  type        = string
  description = "The label set version that ENSIndexer will request from ENSRainbow for deterministic label healing. See https://ensnode.io/ensrainbow/concepts/glossary/#label_set_version for definition."
}

# Label set that ENSRainbow will offer to its clients
variable "ensrainbow_label_set_id" {
  type        = string
  description = "The label set ID that ENSRainbow will offer to its clients. See https://ensnode.io/ensrainbow/concepts/glossary/#label_set_id for definition."
}

variable "ensrainbow_label_set_version" {
  type        = string
  description = "The highest label set version that ENSRainbow will offer to its clients. See https://ensnode.io/ensrainbow/concepts/glossary/#label_set_version for definition."
}
