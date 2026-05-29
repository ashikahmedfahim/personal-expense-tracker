locals {
  name_prefix = "${var.project_name}-${var.environment}"

  enable_https = var.domain_name != "" || var.acm_certificate_arn != ""

  container_image = "${aws_ecr_repository.api.repository_url}:${var.image_tag}"

  dns_apex_suffix = ".${var.dns_apex_domain}"

  namecheap_api_host = trimsuffix(var.domain_name, local.dns_apex_suffix)

  app_secret_keys = [
    "DATABASE_URL",
    "JWT_SECRET",
    "METRICS_TOKEN",
    "RATE_LIMIT_WINDOW_MS",
    "RATE_LIMIT_MAX",
    "REGISTER_RATE_LIMIT_WINDOW_MS",
    "REGISTER_RATE_LIMIT_MAX",
    "LOGIN_RATE_LIMIT_WINDOW_MS",
    "LOGIN_RATE_LIMIT_MAX",
  ]
}
