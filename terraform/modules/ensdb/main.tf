resource "render_postgres" "ensdb" {
  name           = "ensdb"
  plan           = "pro_4gb"
  region         = var.render_region
  environment_id = var.render_environment_id
  version        = "16"

  database_name = "ensdb"
  database_user = "ens_user"

  # Might be configured by an input variable 
  disk_size_gb = var.disk_size_gb

  # https://render.com/docs/postgresql-high-availability
  # No standby instance for now - once we reach sufficient environment maturity, we might want to reconsider
  high_availability_enabled = false
}
