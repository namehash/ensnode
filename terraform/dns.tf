locals {
  ensrainbow_domain = "ensrainbow.${local.railway_environment}.${local.base_domain_name}"
}

data "aws_route53_zone" "ensnode" {
  name         = "${local.base_domain_name}."
  private_zone = false
}

resource "railway_custom_domain" "ensrainbow" {
  domain         = local.ensrainbow_domain
  environment_id = railway_project.this.default_environment.id
  service_id     = railway_service.ensrainbow.id
}

resource "aws_route53_record" "ensrainbow" {
  zone_id = data.aws_route53_zone.ensnode.zone_id
  name    = railway_custom_domain.ensrainbow.domain
  type    = "CNAME"
  ttl     = 300
  records = [railway_custom_domain.ensrainbow.dns_record_value]
}

resource "null_resource" "health_check" {
  depends_on = [aws_route53_record.ensrainbow]
  triggers = {
    version = var.ensnode_version
  }

  # Execute the healthcheck script locally
  provisioner "local-exec" {
    command = "${path.module}/healthcheck.sh https://${aws_route53_record.ensrainbow.name}/health"

    environment = {
      EXPECTED_STATUS = "200"
    }
  }
}
