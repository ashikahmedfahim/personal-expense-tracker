variable "aws_region" {
  type    = string
  default = "eu-north-1"
}

variable "project_name" {
  type    = string
  default = "expense-tracker"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "domain_name" {
  description = "Production API hostname."
  type        = string
  default     = "api.personalexpensetracker.site"
}

variable "route53_zone_id" {
  description = "Route 53 hosted zone ID (optional if route53_zone_name is set)."
  type        = string
  default     = ""
}

variable "route53_zone_name" {
  description = "Leave empty when DNS is on Namecheap (see terraform/NAMECHEAP_DNS.md)."
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  type    = string
  default = ""
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

variable "db_multi_az" {
  type    = bool
  default = false
}

variable "ecs_desired_count" {
  type    = number
  default = 1
}

variable "ecs_min_capacity" {
  type    = number
  default = 1
}

variable "ecs_max_capacity" {
  type    = number
  default = 3
}
