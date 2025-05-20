locals {
  ensrainbow_domain = "ensrainbow.${local.default_environment}.${local.domain_name}"
}

data "aws_route53_zone" "ensnode" {
  name         = "${local.domain_name}."
  private_zone = false
}

resource "railway_custom_domain" "ensrainbow" {
  domain         = local.ensrainbow_domain
  railway_environment_id = railway_project.this.default_environment.id
  service_id     = railway_service.ensrainbow.id
}

resource "aws_route53_record" "ensrainbow" {
  zone_id = data.aws_route53_zone.ensnode.zone_id
  name    = railway_custom_domain.ensrainbow.domain
  type    = "CNAME"
  ttl     = 300
  records = [railway_custom_domain.ensrainbow.dns_record_value]
}
