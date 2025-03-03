output "security_group_id" {
  description = "The security group ID for the codebuild instance"
  value       = module.staging_codebuild.security_group_id
}
