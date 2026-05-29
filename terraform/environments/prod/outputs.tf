output "api_url" {
  value = module.api.api_url
}

output "ecr_repository_url" {
  value = module.api.ecr_repository_url
}

output "ecs_cluster_name" {
  value = module.api.ecs_cluster_name
}

output "ecs_service_name" {
  value = module.api.ecs_service_name
}

output "ecs_task_definition_family" {
  value = module.api.ecs_task_definition_family
}

output "alb_dns_name" {
  value = module.api.alb_dns_name
}

output "acm_validation_records" {
  value = module.api.acm_validation_records
}

output "namecheap_dns" {
  description = "CNAME records to add in Namecheap Advanced DNS."
  value       = module.api.namecheap_dns
}
