resource "aws_codebuild_project" "this" {
  name        = var.project_name
  description = var.project_description

  build_timeout = var.build_timeout
  service_role  = aws_iam_role.codebuild.arn

  artifacts {
    type = "NO_ARTIFACTS"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_LARGE"
    image                       = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    privileged_mode = var.privileged_mode
  }

  logs_config {
    cloudwatch_logs {
      group_name = "/codebuild/${var.project_name}"
    }
  }

  source {
    type            = "GITHUB"
    location        = "https://github.com/Acme-ai/acme.git"
    git_clone_depth = 1
  }

  vpc_config {
    vpc_id = var.vpc_id

    subnets = var.subnet_ids

    security_group_ids = [
      aws_security_group.codebuild.id
    ]
  }
}

resource "aws_codebuild_webhook" "github_webhook" {
  project_name = aws_codebuild_project.this.name
  build_type   = "BUILD"
  filter_group {
    filter {
      type    = "EVENT"
      pattern = "WORKFLOW_JOB_QUEUED"
    }
  }
}

resource "aws_codebuild_source_credential" "github_pac" {
  auth_type   = "PERSONAL_ACCESS_TOKEN"
  server_type = "GITHUB"
  token       = data.aws_secretsmanager_secret_version.github_token.secret_string
}
