# ENSNode configuration
variable "ensnode_version" {
  type = string
}

variable "render_environment_id" {
  type = string
}

variable "render_region" {
  type = string
}

# Database schema configuration
variable "db_schema_version" {
  type        = string
  description = "The database schema version to use for ENSRainbow
  default     = "3"
}

# Label set configuration for ENSRainbow
variable "ensrainbow_label_set_id" {
  type        = string
  description = "The label set ID that ENSRainbow will offer to its clients (e.g., 'subgraph', 'ens-test-env')"
}

variable "ensrainbow_label_set_version" {
  type        = string
  description = "The highest label set version that ENSRainbow will offer to its clients (e.g., '0', '1')"
}
