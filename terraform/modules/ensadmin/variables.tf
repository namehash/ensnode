# ENSNode configuration
variable "ensnode_version" {
  type = string
}

variable "anthropic_api_key" {
  type    = string
  default = null
}

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
# hosted_zone_name is used to retrieve Route53 hosted zone
variable "hosted_zone_name" {
  type        = string
  description = "Base DNS domain (e.g. 'example.com' or 'namehash.io'). Combine with ensnode_environment_name to build full domain name. Must have corresponding domain zone in AWS Route53."
}
# ensnode_environment_name is added as hosted_zone_name prefix to create fqdn. It can be for instance environment - blue/green
variable "ensnode_environment_name" {
  type        = string
  description = "Environment name on which ENSAdmin will be deployed. Combined with hosted_zone_name to build full domain name."
}
