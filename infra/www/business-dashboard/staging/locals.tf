locals {
  domain_name     = "app.acme-staging.com"
  environment     = "staging"
  rds_credentials = jsondecode(data.aws_secretsmanager_secret_version.db_credentials.secret_string)
}
