terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    render = {
      source  = "render-oss/render"
      version = "1.7.0"
    }
  }

  backend "s3" {
    bucket = "ensnode-terraform"
    key    = "render-tfstate.json"
    region = "auto"
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
    use_path_style              = true
    endpoints = {
      s3 = "https://568d25449daec794a4cf277e3c286406.r2.cloudflarestorage.com"
    }
  }
}

# https://registry.terraform.io/providers/render-oss/render/latest/docs
provider "render" {
  api_key                          = var.render_api_key
  owner_id                         = var.render_owner_id
  wait_for_deploy_completion       = true
  skip_deploy_after_service_update = false
}

provider "aws" {
  region = "us-east-1"   # required for legacy Route53 resources in state
}
