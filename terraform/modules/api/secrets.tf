resource "aws_secretsmanager_secret" "app" {
  name                    = "${local.name_prefix}/app"
  recovery_window_in_days = var.environment == "prod" ? 30 : 0

  tags = {
    Name = "${local.name_prefix}-app-secrets"
  }
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id

  secret_string = jsonencode({
    DATABASE_URL                  = local.database_url
    JWT_SECRET                    = var.jwt_secret
    METRICS_TOKEN                 = var.metrics_token
    RATE_LIMIT_WINDOW_MS          = tostring(var.rate_limit_window_ms)
    RATE_LIMIT_MAX                = tostring(var.rate_limit_max)
    REGISTER_RATE_LIMIT_WINDOW_MS = tostring(var.register_rate_limit_window_ms)
    REGISTER_RATE_LIMIT_MAX       = tostring(var.register_rate_limit_max)
    LOGIN_RATE_LIMIT_WINDOW_MS    = tostring(var.login_rate_limit_window_ms)
    LOGIN_RATE_LIMIT_MAX          = tostring(var.login_rate_limit_max)
  })

  depends_on = [
    aws_db_instance.main,
    data.aws_secretsmanager_secret_version.rds_master,
  ]
}
