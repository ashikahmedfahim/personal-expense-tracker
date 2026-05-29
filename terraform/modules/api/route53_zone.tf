data "aws_route53_zone" "selected" {
  count = var.route53_zone_id == "" && var.route53_zone_name != "" ? 1 : 0

  name         = var.route53_zone_name
  private_zone = false
}

locals {
  route53_zone_id = var.route53_zone_id != "" ? var.route53_zone_id : (
    length(data.aws_route53_zone.selected) > 0 ? data.aws_route53_zone.selected[0].zone_id : ""
  )
}
