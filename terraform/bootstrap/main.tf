data "tls_certificate" "github" {
  url = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]

  thumbprint_list = [
    data.tls_certificate.github.certificates[0].sha1_fingerprint,
  ]

  tags = {
    Name = "${var.project_name}-github-oidc"
  }
}

data "aws_iam_policy_document" "deploy_staging_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:environment:staging"]
    }
  }
}

data "aws_iam_policy_document" "deploy_prod_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:environment:production"]
    }
  }
}

resource "aws_iam_role" "deploy_staging" {
  name               = "${var.project_name}-github-deploy-staging"
  assume_role_policy = data.aws_iam_policy_document.deploy_staging_trust.json

  tags = {
    Name        = "${var.project_name}-github-deploy-staging"
    Environment = "staging"
  }
}

resource "aws_iam_role" "deploy_prod" {
  name               = "${var.project_name}-github-deploy-prod"
  assume_role_policy = data.aws_iam_policy_document.deploy_prod_trust.json

  tags = {
    Name        = "${var.project_name}-github-deploy-prod"
    Environment = "production"
  }
}

data "aws_iam_policy_document" "deploy_permissions" {
  statement {
    sid    = "EcrAuth"
    effect = "Allow"
    actions = [
      "ecr:GetAuthorizationToken",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "EcrPush"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:CompleteLayerUpload",
      "ecr:DescribeImages",
      "ecr:DescribeRepositories",
      "ecr:GetDownloadUrlForLayer",
      "ecr:InitiateLayerUpload",
      "ecr:ListImages",
      "ecr:PutImage",
      "ecr:UploadLayerPart",
    ]
    resources = [
      "arn:aws:ecr:${var.aws_region}:*:repository/${var.project_name}-staging-api",
      "arn:aws:ecr:${var.aws_region}:*:repository/${var.project_name}-prod-api",
    ]
  }

  statement {
    sid    = "EcsDeploy"
    effect = "Allow"
    actions = [
      "ecs:DescribeServices",
      "ecs:DescribeTaskDefinition",
      "ecs:DescribeTasks",
      "ecs:ListTasks",
      "ecs:RegisterTaskDefinition",
      "ecs:UpdateService",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "PassRole"
    effect = "Allow"
    actions = [
      "iam:PassRole",
    ]
    resources = [
      "arn:aws:iam::*:role/${var.project_name}-staging-ecs-*",
      "arn:aws:iam::*:role/${var.project_name}-prod-ecs-*",
    ]
  }
}

resource "aws_iam_role_policy" "deploy_staging" {
  name   = "${var.project_name}-deploy-staging"
  role   = aws_iam_role.deploy_staging.id
  policy = data.aws_iam_policy_document.deploy_permissions.json
}

resource "aws_iam_role_policy" "deploy_prod" {
  name   = "${var.project_name}-deploy-prod"
  role   = aws_iam_role.deploy_prod.id
  policy = data.aws_iam_policy_document.deploy_permissions.json
}
