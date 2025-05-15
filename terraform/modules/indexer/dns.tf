locals {
  indexer_domain = "indexer.${var.subdomain_name}.${var.domain_name}"
  api_domain     = "api.${var.subdomain_name}.${var.domain_name}"
}

data "aws_route53_zone" "ensnode" {
  name         = "${var.domain_name}."
  private_zone = false
}

resource "railway_custom_domain" "indexer" {
  domain         = local.indexer_domain
  environment_id = var.environment_id
  service_id     = railway_service.ensindexer.id
}

resource "railway_custom_domain" "api" {
  domain         = local.api_domain
  environment_id = var.environment_id
  service_id     = railway_service.indexer_api.id
}

resource "aws_route53_record" "indexer_validation" {
  zone_id = data.aws_route53_zone.ensnode.zone_id
  name    = railway_custom_domain.indexer.domain
  type    = "CNAME"
  ttl     = 300
  records = [railway_custom_domain.indexer.dns_record_value]
}

resource "aws_route53_record" "api_validation" {
  zone_id = data.aws_route53_zone.ensnode.zone_id
  name    = railway_custom_domain.api.domain
  type    = "CNAME"
  ttl     = 300
  records = [railway_custom_domain.api.dns_record_value]
}
