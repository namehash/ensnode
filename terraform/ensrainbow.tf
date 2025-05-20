resource "railway_service" "ensrainbow" {
  name         = "ensrainbow"
  railway_project_id   = railway_project.this.id
  source_image = "ghcr.io/namehash/ensnode/ensrainbow:${local.ensnode_version}"
  region       = local.railway_region
}
