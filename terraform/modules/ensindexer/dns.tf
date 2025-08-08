locals {
  full_ensindexer_hostname     = "indexer.${var.subdomain_prefix}.${var.base_domain_name}"
  full_ensindexer_api_hostname = "api.${var.subdomain_prefix}.${var.base_domain_name}"
}

data "aws_route53_zone" "ensnode" {
  name         = "${var.base_domain_name}."
  private_zone = false
}

resource "aws_route53_record" "ensindexer_validation" {
  zone_id = data.aws_route53_zone.ensnode.zone_id
  name    = local.full_ensindexer_hostname
  type    = "CNAME"
  ttl     = 300
  records = [replace(render_web_service.ensindexer.url, "https://", "")]
}

resource "aws_route53_record" "ensapir_validation" {
  zone_id = data.aws_route53_zone.ensnode.zone_id
  name    = local.full_ensindexer_api_hostname
  type    = "CNAME"
  ttl     = 300
  records = [replace(render_web_service.ensindexer_api.url, "https://", "")]
}
