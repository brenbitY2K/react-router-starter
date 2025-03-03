output "security_group_id" {
  description = "The security group ID for the codebuild instance"
  value       = aws_security_group.codebuild.id
}
