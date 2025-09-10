#!/bin/bash
set -e
set -a
source .env.local
set +a

terraform init
terraform apply
