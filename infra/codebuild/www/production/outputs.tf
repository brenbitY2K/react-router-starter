output "security_group_id" {
  description = "The security group ID for the codebuild instance"
  value       = module.production_codebuild.security_group_id
}
