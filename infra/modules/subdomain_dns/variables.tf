variable "domain_name" {
  description = "The domain name for the subdomain dashboard (e.g., app.acme.ai)"
  type        = string
}

variable "alb_dns_name" {
  description = "The DNS name of the ALB"
  type        = string
}

variable "alb_zone_id" {
  description = "The Zone ID of the ALB"
  type        = string
}

variable "route53_zone_id" {
  description = "The Zone ID of the Route53 zone"
  type        = string
}

variable "environment" {
  description = "The environment (e.g., production, staging)"
  type        = string
}
