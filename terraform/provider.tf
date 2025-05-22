terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    railway = {
      source  = "terraform-community-providers/railway"
      version = "0.4.6"
    }
  }

  backend "s3" {
    bucket = "ensnode-terraform"
    key    = "tfstate"
    region = "us-east-1"
  }
}

provider "railway" {
  token = var.railway_token
}
