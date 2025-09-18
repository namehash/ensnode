# Render configuration

# See https://render.com/docs/projects
variable "render_environment_id" {
  type = string
}

# See https://render.com/docs/blueprint-spec#region
variable "render_region" {
  type = string
}

# ENSDB configuration

variable "disk_size_gb" {
  type = number
}
