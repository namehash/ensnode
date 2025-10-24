locals {
  ensindexer_fqdn = "indexer.${var.ensnode_indexer_type}.${var.ensnode_environment_name}.${var.hosted_zone_name}"
  ensapi_fqdn     = "api.${var.ensnode_indexer_type}.${var.ensnode_environment_name}.${var.hosted_zone_name}"
}

data "aws_route53_zone" "ensnode" {
  name         = "${var.hosted_zone_name}."
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
  name    = local.ensapi_fqdn
  type    = "CNAME"
  ttl     = 300
  records = [replace(render_web_service.ensapi.url, "https://", "")]
}
