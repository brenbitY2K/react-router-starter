data "aws_secretsmanager_secret" "github_token" {
  name = "/github/pat"
}

data "aws_secretsmanager_secret_version" "github_token" {
  secret_id = data.aws_secretsmanager_secret.github_token.id
}
