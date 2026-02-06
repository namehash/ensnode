# Render configuration

# See https://render.com/docs/projects
variable "render_environment_id" {
  type = string
}

# See https://render.com/docs/blueprint-spec#region
variable "render_region" {
  type = string
}

# See https://render.com/docs/web-services
variable "render_instance_plan" {
  type = string
}

# DNS configuration

# Example: ensnode.io
# See main.tf for more details
variable "hosted_zone_name" {
  type = string
}

# Example: blue
# See main.tf for more details on how this is used, including for building fqdn values.
variable "ensnode_environment_name" {
  type = string
}

# ENSAdmin configuration

variable "ensnode_version" {
  type = string
}

variable "anthropic_api_key" {
  type    = string
  default = null
}

variable "next_public_server_connection_library" {
  type        = string
  description = "Comma-separated list of server connection library URLs that ENSAdmin will connect to. Example: 'https://api.mainnet.example.com,https://api.sepolia.example.com'"
  default     = ""
}
