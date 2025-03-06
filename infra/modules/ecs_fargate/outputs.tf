output "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer"
  value       = aws_alb.main.dns_name
}

output "alb_zone_id" {
  description = "The Hosted Zone ID of the Application Load Balancer"
  value       = aws_alb.main.zone_id
}

output "ecs_cluster_name" {
  description = "The name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "The name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "ecs_tasks_security_group_id" {
  description = "The security group ID for ECS tasks"
  value       = aws_security_group.ecs_tasks.id
}
