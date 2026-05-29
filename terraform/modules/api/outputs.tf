output "api_url" {
  description = "Public API base URL."
  value       = local.enable_https ? "https://${var.domain_name}" : "http://${aws_lb.main.dns_name}"
}

output "domain_name" {
  value = var.domain_name
}

output "alb_dns_name" {
  description = "ALB DNS name (for external DNS CNAME if not using Route 53)."
  value       = aws_lb.main.dns_name
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN attached to the ALB."
  value = local.enable_https ? (
    var.acm_certificate_arn != "" ? var.acm_certificate_arn : aws_acm_certificate.main[0].arn
  ) : null
}

output "acm_validation_records" {
  description = "DNS records to add when route53_zone_id is empty (manual ACM validation)."
  value = length(aws_acm_certificate.main) > 0 && local.route53_zone_id == "" ? [
    for dvo in aws_acm_certificate.main[0].domain_validation_options : {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  ] : []
}

output "namecheap_dns" {
  description = "Records to add in Namecheap Advanced DNS (when not using Route 53)."
  value = local.route53_zone_id == "" ? {
    acm_validation = length(aws_acm_certificate.main) > 0 ? [
      for dvo in aws_acm_certificate.main[0].domain_validation_options : {
        type  = dvo.resource_record_type
        host  = trimsuffix(trimsuffix(dvo.resource_record_name, "."), local.dns_apex_suffix)
        value = dvo.resource_record_value
      }
    ] : []
    api_cname = {
      type  = "CNAME"
      host  = local.namecheap_api_host
      value = aws_lb.main.dns_name
    }
    api_url = local.enable_https ? "https://${var.domain_name}" : "http://${aws_lb.main.dns_name}"
  } : null
}

output "ecr_repository_url" {
  value = aws_ecr_repository.api.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  value = aws_ecs_service.api.name
}

output "ecs_task_definition_family" {
  value = aws_ecs_task_definition.api.family
}

output "rds_endpoint" {
  value = aws_db_instance.main.address
}

output "cloudwatch_log_group" {
  value = aws_cloudwatch_log_group.api.name
}

output "ecs_autoscaling_min" {
  value = var.ecs_min_capacity
}

output "ecs_autoscaling_max" {
  value = var.ecs_max_capacity
}
