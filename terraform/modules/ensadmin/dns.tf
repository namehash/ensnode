locals {
  ensadmin_fqdn = "ensadmin.${var.subdomain_prefix}.${var.base_domain_name}"
}

data "aws_route53_zone" "ensnode" {
  name         = "${var.base_domain_name}."
  private_zone = false
}

resource "aws_route53_record" "ensadmin_validation" {
  zone_id = data.aws_route53_zone.ensnode.zone_id
  name    = local.ensadmin_fqdn
  type    = "CNAME"
  ttl     = 300
  records = [replace(render_web_service.ensadmin.url, "https://", "")]
}
