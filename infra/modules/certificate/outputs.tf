output "certificate_arn" {
  value = aws_acm_certificate.cert.arn
}

output "certificate_domain" {
  value = var.domain_name
}
