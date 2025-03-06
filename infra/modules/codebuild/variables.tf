variable "project_name" {
  type = string
}

variable "project_description" {
  type = string
}

variable "build_timeout" {
  type        = number
  description = "Time in minutes AWS should wait to timeout."
  default     = 5
}

variable "privileged_mode" {
  type        = bool
  description = "Allow codebuild to run docker"
  default     = false
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default     = {}
}

variable "aws_region" {
  description = "The AWS region"
  type        = string
  default     = "us-east-1"
}

variable "account_id" {
  description = "The AWS account ID"
  type        = string
}


variable "additional_policy_arns" {
  description = "List of additional IAM Policy ARNs to attach to the CodeBuild role"
  type        = list(string)
  default     = []
}

variable "inline_policy_documents" {
  description = "Map of inline IAM policy documents to attach to the CodeBuild role"
  type        = map(string)
  default     = {}
}
