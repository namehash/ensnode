locals {
  ensindexer_fqdn     = "indexer.${var.subdomain_prefix}.${var.base_domain_name}"
  ensindexer_api_fqdn = "api.${var.subdomain_prefix}.${var.base_domain_name}"
}

data "aws_route53_zone" "ensnode" {
  name         = "${var.base_domain_name}."
  private_zone = false
}

resource "aws_route53_record" "ensindexer_validation" {
  zone_id = data.aws_route53_zone.ensnode.zone_id
  name    = local.ensindexer_fqdn
  type    = "CNAME"
  ttl     = 300
  records = [replace(render_web_service.ensindexer.url, "https://", "")]
}

resource "aws_route53_record" "ensapi_validation" {
  zone_id = data.aws_route53_zone.ensnode.zone_id
  name    = local.ensindexer_api_fqdn
  type    = "CNAME"
  ttl     = 300
  records = [replace(render_web_service.ensindexer_api.url, "https://", "")]
}
