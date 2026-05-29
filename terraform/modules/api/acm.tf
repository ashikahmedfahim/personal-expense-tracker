resource "aws_acm_certificate" "main" {
  count = local.enable_https && var.acm_certificate_arn == "" ? 1 : 0

  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${local.name_prefix}-cert"
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = local.route53_zone_id != "" && length(aws_acm_certificate.main) > 0 ? {
    for dvo in aws_acm_certificate.main[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  zone_id = local.route53_zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60

  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "main" {
  count = length(aws_acm_certificate.main) > 0 ? 1 : 0

  certificate_arn = aws_acm_certificate.main[0].arn

  validation_record_fqdns = local.route53_zone_id != "" ? [
    for record in aws_route53_record.cert_validation : record.fqdn
  ] : [
    for dvo in aws_acm_certificate.main[0].domain_validation_options : dvo.resource_record_name
  ]
}
