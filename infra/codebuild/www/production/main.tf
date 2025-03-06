module "production_codebuild" {
  source = "../../../modules/codebuild"

  project_name        = local.project_name
  project_description = "GitHub Action CodeBuild for the www projects"
  aws_region          = data.aws_region.current.name
  account_id          = data.aws_caller_identity.current.account_id

  privileged_mode = true

  vpc_id     = data.terraform_remote_state.shared.outputs.vpc_id
  subnet_ids = data.terraform_remote_state.shared.outputs.private_subnet_ids

  additional_policy_arns = [
    aws_iam_policy.codebuild_policy.arn
  ]
}

