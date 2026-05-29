module "api" {
  source = "../../modules/api"

  aws_region   = var.aws_region
  project_name = var.project_name
  environment  = "staging"
  vpc_cidr     = var.vpc_cidr

  domain_name       = var.domain_name
  route53_zone_id   = var.route53_zone_id
  route53_zone_name = var.route53_zone_name
  acm_certificate_arn = var.acm_certificate_arn
  image_tag           = var.image_tag
  jwt_secret          = var.jwt_secret
  metrics_token       = var.metrics_token

  db_backup_retention_days = 3
  ecs_desired_count        = var.ecs_desired_count
  ecs_min_capacity         = var.ecs_min_capacity
  ecs_max_capacity         = var.ecs_max_capacity
}
