data "terraform_remote_state" "shared" {
  backend = "remote"
  config = {
    organization = "acme"
    workspaces = {
      name = "production-shared"
    }
  }
}

data "aws_secretsmanager_secret" "db_credentials" {
  name = "/production/database/credentials"
}

data "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = data.aws_secretsmanager_secret.db_credentials.id
}

