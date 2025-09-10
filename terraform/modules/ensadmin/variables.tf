# ENSNode configuration
variable "ensnode_version" {
  type = string
}

# Render configuration
variable "render_environment_id" {
  type = string
}

variable "render_region" {
  type = string
}

variable "instance_type" {
  type = string
}

variable "anthropic_api_key" {
  type = string
}

# DNS configuration
# base_domain_name is used to retrieve Route53 hosted zone
variable "base_domain_name" {
  type        = string
  description = "Base DNS domain (e.g. 'example.com' or 'namehash.io'). Combine with subdomain_prefix to build full domain name."
}
# subdomain_prefix is added as base_domain_name prefix to create fqdn. It can be for instance environment - blue/green
variable "subdomain_prefix" {
  type        = string
  description = "Subdomain prefix (e.g. 'green' or 'staging'). Combine with base_domain_name to build full domain name."
}
