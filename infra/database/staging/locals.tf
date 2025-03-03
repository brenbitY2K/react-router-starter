locals {
  db_name  = "staging-primary"
  db_creds = jsondecode(data.aws_secretsmanager_secret_version.db_credentials.secret_string)
}
