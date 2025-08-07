resource "render_postgres" "database" {
  name           = "ensnode-db"
  plan           = "pro_4gb"
  region         = var.render_region
  environment_id = var.render_environment_id
  version        = "16"

  database_name = "ensnode_db"
  database_user = "ensnode_user"

  disk_size_gb = "120"

  high_availability_enabled = false
}