variable "domain_name" {
  description = "Primary domain name for the certificate"
  type        = string
}

variable "route53_zone_id" {
  description = "Route53 zone ID for DNS validation"
  type        = string
}

variable "environment" {
  description = "Environment tag value"
  type        = string
}

variable "include_www" {
  description = "Whether to include www subdomain in the certificate"
  type        = bool
  default     = false
}
