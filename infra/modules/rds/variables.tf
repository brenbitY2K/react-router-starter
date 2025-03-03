variable "username" {
  type = string
}

variable "password" {
  type = string
}

variable "db_subnet_ids" {
  description = "List of private subnet IDs for the RDS instance"
  type        = list(string)
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "name" {
  type = string
}

variable "db_port" {
  description = "The port on which the database accepts connections"
  type        = number
  default     = 5432
}

variable "security_group_ids" {
  description = "List of security group IDs that can access the RDS instance"
  type        = list(string)
}

# RDS Configuration Variables
variable "engine" {
  description = "The database engine to use"
  type        = string
  default     = "postgres"
}

variable "engine_version" {
  description = "The version of the database engine"
  type        = string
  default     = "16.3"
}

variable "instance_class" {
  description = "The instance type of the RDS instance"
  type        = string
  default     = "db.t3.micro"
}

variable "allocated_storage" {
  description = "The allocated storage in gigabytes"
  type        = number
  default     = 20
}

variable "storage_type" {
  description = "The storage type"
  type        = string
  default     = "gp2"
}

variable "multi_az" {
  description = "Whether to create a Multi-AZ RDS instance"
  type        = bool
  default     = true
}

variable "backup_retention_period" {
  description = "The number of days to retain backups"
  type        = number
  default     = 7
}

variable "maintenance_window" {
  description = "The time range each week during which system maintenance can occur"
  type        = string
  default     = "Mon:00:00-Mon:03:00"
}

variable "skip_final_snapshot" {
  description = "Whether to skip the creation of a final snapshot before deletion"
  type        = bool
  default     = true
}
