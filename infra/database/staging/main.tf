module "rds" {
  source             = "../../modules/rds"
  name               = local.db_name
  username           = local.db_creds.username
  password           = local.db_creds.password
  db_subnet_ids      = data.terraform_remote_state.shared.outputs.private_subnet_ids
  security_group_ids = [data.terraform_remote_state.business_dashboard.outputs.ecs_tasks_security_group_id, data.terraform_remote_state.codebuild.outputs.security_group_id]
  vpc_id             = data.terraform_remote_state.shared.outputs.vpc_id
}
