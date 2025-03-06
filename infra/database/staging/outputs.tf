output "rds_endpoint" {
  value = module.rds.endpoint
}

output "rds_security_group_id" {
  value = module.rds.security_group_id
}

output "db_name" {
  value       = local.db_name
  description = "Name of the RDS database"
}
