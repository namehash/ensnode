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

# DNS configuration
variable "base_domain_name" {
  type        = string
  description = "Base DNS domain (e.g. 'example.com' or 'namehash.io'). Combine with subdomain_prefix to build full domain name."
}

variable "subdomain_prefix" {
  type        = string
  description = "Subdomain prefix (e.g. 'green' or 'staging'). Combine with base_domain_name to build full domain name."
}
