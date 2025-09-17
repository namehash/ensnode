# Render configuration

variable "render_environment_id" {
  type = string
}

variable "render_region" {
  type = string
}

variable "render_instance_plan" {
  type = string
}

# DNS configuration

# Example: ensnode.io
# See main.tf for more details
variable "hosted_zone_name" {
  type        = string
}

# Example: blue
# See main.tf for more details on how this is used, including for building fqdn values.
variable "ensnode_environment_name" {
  type        = string
}

# ENSAdmin configuration

variable "ensnode_version" {
  type = string
}

variable "anthropic_api_key" {
  type    = string
  default = null
}
