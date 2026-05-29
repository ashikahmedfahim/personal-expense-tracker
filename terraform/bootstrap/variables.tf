variable "aws_region" {
  type    = string
  default = "eu-north-1"
}

variable "project_name" {
  type    = string
  default = "expense-tracker"
}

variable "github_repository" {
  description = "GitHub repo in OWNER/NAME form (e.g. ashikahmedfahim/personal-expense-tracker)."
  type        = string
}
