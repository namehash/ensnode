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
    key    = "render-tfstate"
    region = "us-east-1"
  }
}

# https://registry.terraform.io/providers/render-oss/render/latest/docs
provider "render" {
  api_key                    = var.render_api_key
  owner_id                   = var.render_owner_id
  wait_for_deploy_completion = true
  skip_deploy_after_service_update = false
}
