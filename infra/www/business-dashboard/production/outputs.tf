output "ecr_repository_url" {
  value = module.ecr.repository_url
}

output "alb_dns_name" {
  value = module.ecs_fargate.alb_dns_name
}

output "ecs_tasks_security_group_id" {
  value = module.ecs_fargate.ecs_tasks_security_group_id
}
