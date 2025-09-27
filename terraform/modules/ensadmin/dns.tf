locals {
  ensadmin_fqdn = "admin.${var.ensnode_environment_name}.${var.hosted_zone_name}"
}

data "aws_route53_zone" "ensnode" {
  name         = "${var.hosted_zone_name}."
  private_zone = false
}

resource "aws_route53_record" "ensadmin_domain_validation" {
  zone_id = data.aws_route53_zone.ensnode.zone_id
  name    = local.ensadmin_fqdn
  type    = "CNAME"
  ttl     = 300
  records = [replace(render_web_service.ensadmin.url, "https://", "")]
}
