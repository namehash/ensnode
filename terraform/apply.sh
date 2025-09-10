#!/bin/bash
set -e
set -a
source .env.local
set +a

terraform workspace select $TF_VAR_render_environment

terraform init
terraform apply
