locals {
  full_ensindexer_hostname   = "indexer.${var.subdomain_name}.${var.domain_name}"
  full_ensindexer_api_hostname     = "api.${var.subdomain_name}.${var.domain_name}"
}

data "aws_route53_zone" "ensnode" {
  name         = "${var.domain_name}."
  private_zone = false
}

resource "railway_custom_domain" "ensindexer" {
  domain         = local.full_ensindexer_hostname
  environment_id = var.railway_environment_id
  service_id     = railway_service.ensindexer.id
}

resource "railway_custom_domain" "api" {
  domain         = local.full_ensindexer_api_hostname
  environment_id = var.railway_environment_id
  service_id     = railway_service.ensindexer_api.id
}

resource "aws_route53_record" "ensindexer_validation" {
  zone_id = data.aws_route53_zone.ensnode.zone_id
  name    = railway_custom_domain.ensindexer.domain
  type    = "CNAME"
  ttl     = 300
  records = [railway_custom_domain.ensindexer.dns_record_value]
}

resource "aws_route53_record" "api_validation" {
  zone_id = data.aws_route53_zone.ensnode.zone_id
  name    = railway_custom_domain.api.domain
  type    = "CNAME"
  ttl     = 300
  records = [railway_custom_domain.api.dns_record_value]
}
