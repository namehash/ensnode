# ENSNode Terraform Infrastructure

> **Note**: These Terraform scripts are currently specific to ENSNode instances hosted by NameHash Labs. While these scripts provide a good starting point for deploying your own ENSNode instance, you will need to make modifications to suit your specific deployment needs. We plan to generalize these scripts in the future to better support community deployments.

## Infrastructure Overview

This Terraform configuration manages the infrastructure for ENSNode deployments, primarily focusing on AWS resources. The infrastructure includes:

### AWS Resources
- DNS configuration and management
- S3 bucket for Terraform state - `ensnode-terraform` (must be pre-existing with a predefined name)

### Railway Resources
- Application deployment and hosting
- Service configuration
- Note: Railway volume size cannot be defined in Terraform and must be manually increased through the Railway UI after deployment

## Getting Started

1. Copy `.env.sample` to `.env.local` and fill in your configuration values
2. Initialize Terraform:
   ```bash
   terraform init
   ```
3. Review the planned changes:
   ```bash
   terraform plan
   ```
4. Apply the configuration:
   ```bash
   terraform apply
   ```
