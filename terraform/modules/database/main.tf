locals {
  pg_host                = "postgres.railway.internal"
  pg_port                = "5432"
  pg_user                = "postgres"
  pg_database            = "postgres"
  # Increase shared memory for this container on Railway from the default (64MB) to 512MB.
  railway_shm_size_bytes = "512000000"
  database_url           = "postgresql://${local.pg_user}:${random_string.pg_password.result}@${local.pg_host}:${local.pg_port}/${local.pg_database}"
}

resource "random_string" "pg_password" {
  length  = 16
  special = false
}

resource "railway_service" "database" {
  name         = "postgres"
  source_image = "postgres:17"
  railway_project_id   = var.railway_project_id
  region       = var.railway_region
  volume = {
    mount_path = "/var/lib/postgresql"
    name       = "postgres_mount"
  }
}

resource "railway_variable_collection" "database" {
  railway_environment_id = var.railway_environment_id
  service_id     = railway_service.database.id

  variables = [
    {
      name  = "PGHOST"
      value = local.pg_host
    },
    {
      name  = "PGPORT"
      value = local.pg_port
    },
    {
      name  = "PGUSER"
      value = local.pg_user
    },
    {
      name  = "PGPASSWORD"
      value = random_string.pg_password.result
    },
    {
      name  = "POSTGRES_PASSWORD"
      value = random_string.pg_password.result
    },
    {
      name  = "PGDATABASE"
      value = local.pg_database
    },
    {
      name  = "DATABASE_URL"
      value = local.database_url
    },
    {
      name  = "RAILWAY_SHM_SIZE_BYTES"
      value = local.railway_shm_size_bytes
    }
  ]
}
