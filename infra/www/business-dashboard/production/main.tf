data "aws_secretsmanager_secret" "env_vars" {
  name = "/${local.environment}/www/business-dashboard/env"
}

module "dns" {
  source          = "../../../modules/subdomain_dns"
  domain_name     = local.domain_name
  alb_dns_name    = module.ecs_fargate.alb_dns_name
  alb_zone_id     = module.ecs_fargate.alb_zone_id
  route53_zone_id = data.terraform_remote_state.shared.outputs.route53_zone_id
  environment     = local.environment
}

module "certificate" {
  source          = "../../../modules/certificate"
  domain_name     = local.domain_name
  route53_zone_id = data.terraform_remote_state.shared.outputs.route53_zone_id
  environment     = local.environment
}

module "ecr" {
  source    = "../../../modules/ecr"
  repo_name = "${local.environment}-business-dashboard"
}

module "ecs_fargate" {
  source = "../../../modules/ecs_fargate"

  app_name           = "${local.environment}-business-dashboard"
  alb_name           = "${local.environment}-bd-alb"
  cluster_name       = "${local.environment}-business-dashboard-cluster"
  ecr_repository_url = module.ecr.repository_url
  image_tag          = "latest"
  vpc_id             = data.terraform_remote_state.shared.outputs.vpc_id
  certificate_arn    = module.certificate.certificate_arn
  cpu                = "1024"
  memory             = "2048"
  desired_count      = 2

  public_subnet_ids  = data.terraform_remote_state.shared.outputs.public_subnet_ids
  private_subnet_ids = data.terraform_remote_state.shared.outputs.private_subnet_ids

  container_port = 3000

  env_var_secretsmanager_secret_arn = data.aws_secretsmanager_secret.env_vars.arn

  environment_variables = [
    {
      name  = "DOMAIN"
      value = local.domain_name
    },
    {
      name  = "CLOUDINARY_CLOUD_NAME"
      value = "dpbmdvegv"
    },
    {
      name  = "GOOGLE_CLIENT_ID"
      value = "667517779055-nock06g7ja7if8iagm6sr4bq909mpdai.apps.googleusercontent.com"
    },
    {
      name  = "STAGE"
      value = local.environment
    }
  ]

  secrets = [
    {
      name      = "DATABASE_URL"
      valueFrom = "${data.aws_secretsmanager_secret.env_vars.arn}:DATABASE_URL::"
    },
    {
      name      = "SESSION_SECRET"
      valueFrom = "${data.aws_secretsmanager_secret.env_vars.arn}:SESSION_SECRET::"
    },
    {
      name      = "CLOUDINARY_API_KEY"
      valueFrom = "${data.aws_secretsmanager_secret.env_vars.arn}:CLOUDINARY_API_KEY::"
    },
    {
      name      = "CLOUDINARY_API_SECRET"
      valueFrom = "${data.aws_secretsmanager_secret.env_vars.arn}:CLOUDINARY_API_SECRET::"
    },
    {
      name      = "BETTERSTACK_LOGGING_SOURCE_TOKEN"
      valueFrom = "${data.aws_secretsmanager_secret.env_vars.arn}:BETTERSTACK_LOGGING_SOURCE_TOKEN::"
    },
    {
      name      = "EMAIL_OTP_JWT_SECRET"
      valueFrom = "${data.aws_secretsmanager_secret.env_vars.arn}:EMAIL_OTP_JWT_SECRET::"
    },
    {
      name      = "GOOGLE_CLIENT_SECRET"
      valueFrom = "${data.aws_secretsmanager_secret.env_vars.arn}:GOOGLE_CLIENT_SECRET::"
    },
    {
      name      = "IPAPI_ACCESS_KEY"
      valueFrom = "${data.aws_secretsmanager_secret.env_vars.arn}:IPAPI_ACCESS_KEY::"
    },
    {
      name      = "STRIPE_SECRET_KEY"
      valueFrom = "${data.aws_secretsmanager_secret.env_vars.arn}:STRIPE_SECRET_KEY::"
    },
    {
      name      = "STRIPE_WEBHOOK_SECRET"
      valueFrom = "${data.aws_secretsmanager_secret.env_vars.arn}:STRIPE_WEBHOOK_SECRET::"
    },
    {
      name      = "POSTMARK_SERVER_TOKEN"
      valueFrom = "${data.aws_secretsmanager_secret.env_vars.arn}:POSTMARK_SERVER_TOKEN::"
    },
    {
      name      = "OPENAI_API_KEY"
      valueFrom = "${data.aws_secretsmanager_secret.env_vars.arn}:OPENAI_API_KEY::"
    },
    {
      name      = "KLAVIYO_PRIVATE_API_KEY"
      valueFrom = "${data.aws_secretsmanager_secret.env_vars.arn}:KLAVIYO_PRIVATE_API_KEY::"
    }
  ]
}
