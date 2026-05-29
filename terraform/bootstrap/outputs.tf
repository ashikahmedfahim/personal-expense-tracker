output "github_oidc_provider_arn" {
  value = aws_iam_openid_connect_provider.github.arn
}

output "deploy_role_arn_staging" {
  description = "GitHub secret AWS_DEPLOY_ROLE_ARN for environment staging."
  value       = aws_iam_role.deploy_staging.arn
}

output "deploy_role_arn_production" {
  description = "GitHub secret AWS_DEPLOY_ROLE_ARN for environment production."
  value       = aws_iam_role.deploy_prod.arn
}
