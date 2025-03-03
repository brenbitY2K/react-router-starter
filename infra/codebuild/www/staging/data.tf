data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

data "terraform_remote_state" "shared" {
  backend = "remote"
  config = {
    organization = "acme"
    workspaces = {
      name = "staging-shared"
    }
  }
}
