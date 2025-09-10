
locals {
  render_region = "ohio"
}

resource "render_project" "ensnode" {
  name = "ENSNode-routing"
  environments = {
    "default" : {
      name : "routing",
      # https://render.com/docs/projects#protected-environments
      # "unprotected" allows all Render team members (not just admins) to make destructive changes to designated resources
      protected_status : "unprotected"
    }
  }
}

resource "render_web_service" "traefik" {
  name           = "traefik"
  plan           = "starter"
  region         = local.render_region
  environment_id = render_project.ensnode.environments["default"].id

  runtime_source = {
    image = {
      image_url = "traefik"
      tag       = "v3.5.1"
    }
  }
}


resource "render_web_service" "consul" {
  name           = "consul"
  plan           = "starter"
  region         = local.render_region
  environment_id = render_project.ensnode.environments["default"].id

  runtime_source = {
    image = {
      image_url = "consul"
      tag       = "1.15.4"
    }
  }

  disk = {
    name       = "consul-data"
    mount_path = "/consul/data"
    size_gb    = 10
  }

  env_vars = {
    CONSUL_BIND_INTERFACE   = "eth0"
    CONSUL_CLIENT_INTERFACE = "eth0"
    CONSUL_UI               = "true"
  }

  # Consul configuration
  start_command = merge([
    "consul", "agent",
    "-server",
    "-bootstrap-expect=1",
    "-data-dir=/consul/data",
    "-retry-join=consul-server",
  ], " ")

  health_check_path = "/v1/status/leader"
}
