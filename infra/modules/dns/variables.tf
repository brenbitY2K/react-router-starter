variable "environment" {
  type = string
}

variable "domain_name" {
  description = "The domain name to manage"
  type        = string
}

variable "alb_dns_name" {
  description = "The DNS name of the ALB"
  type        = string
}

variable "alb_zone_id" {
  description = "The hosted zone ID of the ALB"
  type        = string
}

variable "route53_zone_id" {
  description = "The Zone ID of the Route53 zone"
  type        = string
}

variable "ssl_certificate_arn" {
  description = "SSL certificate ARN"
  type        = string
}
