variable "app_name" {
  description = "Name of the application"
  type        = string
}

variable "alb_name" {
  description = "Name of the ALB (needs to be short)"
  type        = string
}

variable "cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "ecr_repository_url" {
  description = "URL of the ECR repository"
  type        = string
}

variable "image_tag" {
  description = "Tag of the Docker image to deploy"
  type        = string
}

variable "container_port" {
  description = "Port exposed by the Docker image"
  type        = number
  default     = 3000
}

variable "cpu" {
  description = "Fargate instance CPU units to provision"
  type        = string
  default     = "256"
}

variable "memory" {
  description = "Fargate instance memory to provision (in MiB)"
  type        = string
  default     = "512"
}

variable "desired_count" {
  description = "Number of Docker containers to run"
  type        = number
  default     = 1
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "certificate_arn" {
  description = "The ARN of the SSL certificate in ACM"
  type        = string
}

variable "env_var_secretsmanager_secret_arn" {
  description = "The secrets manager ARN for the environment variable secrets"
  type        = string
}

variable "environment_variables" {
  description = "A list of environment variables to pass to the container"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "secrets" {
  description = "A list of secrets to pass to the container"
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default = []
}
