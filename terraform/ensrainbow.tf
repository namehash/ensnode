resource "railway_service" "ensrainbow" {
  name         = "ensrainbow"
  project_id   = railway_project.this.id
  source_image = "ghcr.io/namehash/ensnode/ensrainbow:${var.ensnode_version}"
  region       = local.railway_region
}
