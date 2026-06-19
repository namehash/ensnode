# Render configuration

variable "render_environment_id" {
  type = string
}

variable "render_region" {
  type = string
}

variable "render_instance_plan" {
  type    = string
  default = "starter"
}

# EnsRainbowBeam configuration

variable "ensnode_version" {
  type = string
}

variable "ensnode_url" {
  type        = string
  description = "Base URL of an ENSApi instance exposing Omnigraph at /api/omnigraph."
}

variable "port" {
  type    = number
  default = 4444
}

