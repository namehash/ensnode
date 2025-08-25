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

variable "db_schema_version" {
  type    = string
  default = "3"
}

variable "label_set_id" {
  type    = string
  default = "subgraph"
}

variable "label_set_version" {
  type    = string
  default = "0"
}

