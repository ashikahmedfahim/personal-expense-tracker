resource "aws_db_parameter_group" "postgres" {
  name   = "${local.name_prefix}-postgres17"
  family = "postgres17"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  tags = {
    Name = "${local.name_prefix}-postgres-params"
  }
}

resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-postgres"

  engine         = "postgres"
  engine_version = "17.2"

  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage_gb
  max_allocated_storage = var.db_allocated_storage_gb * 2
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username

  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.postgres.name

  multi_az                  = var.db_multi_az
  publicly_accessible       = false
  backup_retention_period   = var.db_backup_retention_days
  backup_window             = "03:00-04:00"
  maintenance_window        = "sun:04:00-sun:05:00"
  deletion_protection       = var.environment == "prod"
  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${local.name_prefix}-final" : null
  copy_tags_to_snapshot     = true

  auto_minor_version_upgrade = true
  apply_immediately          = false

  tags = {
    Name = "${local.name_prefix}-rds"
  }
}

data "aws_secretsmanager_secret_version" "rds_master" {
  secret_id = aws_db_instance.main.master_user_secret[0].secret_arn

  depends_on = [aws_db_instance.main]
}

locals {
  rds_master_credentials = jsondecode(data.aws_secretsmanager_secret_version.rds_master.secret_string)
  database_url           = "postgresql://${local.rds_master_credentials.username}:${urlencode(local.rds_master_credentials.password)}@${aws_db_instance.main.address}:${aws_db_instance.main.port}/${var.db_name}"
}
