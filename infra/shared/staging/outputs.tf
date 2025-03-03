output "vpc_id" {
  value = module.networking.vpc_id
}

output "public_subnet_ids" {
  value = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  value = module.networking.private_subnet_ids
}

output "route53_zone_id" {
  value = aws_route53_zone.primary.zone_id
}

output "name_servers" {
  description = "List of name servers for the hosted zone"
  value       = aws_route53_zone.primary.name_servers
}
