terraform {
  cloud {
    organization = "acme"
    workspaces {
      name = "production-shared"
    }
  }
}

module "networking" {
  source = "../../modules/networking"

  environment          = "production"
  vpc_cidr             = "10.0.0.0/16"
  public_subnet_count  = 2
  private_subnet_count = 2
}

resource "aws_route53_zone" "primary" {
  name = "acme.ai"
}
