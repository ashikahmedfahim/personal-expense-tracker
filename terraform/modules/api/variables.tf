variable "aws_region" {
  description = "AWS region (use eu-north-1 Stockholm for Denmark-adjacent latency)."
  type        = string
}

variable "project_name" {
  description = "Short name used in resource naming."
  type        = string
  default     = "expense-tracker"
}

variable "environment" {
  description = "Deployment environment label (prod or staging)."
  type        = string

  validation {
    condition     = contains(["prod", "staging"], var.environment)
    error_message = "environment must be prod or staging."
  }
}

variable "vpc_cidr" {
  description = "VPC CIDR block (must differ per environment in the same account)."
  type        = string
}

variable "domain_name" {
  description = "Public API hostname for HTTPS (e.g. api.personalexpensetracker.site)."
  type        = string
}

variable "route53_zone_id" {
  description = "Route 53 hosted zone ID. Leave empty if route53_zone_name is set, or for manual DNS."
  type        = string
  default     = ""
}

variable "route53_zone_name" {
  description = "Route 53 zone name to look up. Leave empty when using external DNS (e.g. Namecheap)."
  type        = string
  default     = ""
}

variable "dns_apex_domain" {
  description = "Apex domain for shortening FQDNs in Namecheap/manual DNS instructions."
  type        = string
  default     = "personalexpensetracker.site"
}

variable "acm_certificate_arn" {
  description = "Optional existing ACM certificate ARN (same region as ALB). If set, skips ACM creation."
  type        = string
  default     = ""
}

variable "db_name" {
  type    = string
  default = "expense_tracker"
}

variable "db_username" {
  type    = string
  default = "app_admin"
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "db_allocated_storage_gb" {
  type    = number
  default = 20
}

variable "db_multi_az" {
  type    = bool
  default = false
}

variable "db_backup_retention_days" {
  type    = number
  default = 7
}

variable "ecs_cpu" {
  type    = number
  default = 512
}

variable "ecs_memory" {
  type    = number
  default = 1024
}

variable "ecs_desired_count" {
  description = "Initial/desired task count (autoscaling adjusts between min and max)."
  type        = number
  default     = 1
}

variable "ecs_min_capacity" {
  description = "Minimum Fargate tasks (ALB distributes traffic across tasks)."
  type        = number
  default     = 1
}

variable "ecs_max_capacity" {
  description = "Maximum Fargate tasks under load."
  type        = number
  default     = 3
}

variable "ecs_autoscaling_target_cpu" {
  description = "Target average CPU % for scale out/in."
  type        = number
  default     = 70
}

variable "image_tag" {
  type    = string
  default = "latest"
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "metrics_token" {
  type      = string
  sensitive = true
}

variable "allowed_cidr_blocks" {
  type    = list(string)
  default = ["0.0.0.0/0"]
}

variable "rate_limit_window_ms" {
  type    = number
  default = 900000
}

variable "rate_limit_max" {
  type    = number
  default = 100
}

variable "register_rate_limit_window_ms" {
  type    = number
  default = 900000
}

variable "register_rate_limit_max" {
  type    = number
  default = 5
}

variable "login_rate_limit_window_ms" {
  type    = number
  default = 900000
}

variable "login_rate_limit_max" {
  type    = number
  default = 5
}
