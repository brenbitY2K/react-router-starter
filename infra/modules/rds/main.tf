resource "aws_db_subnet_group" "this" {
  name       = "${var.name}-db-subnet-group"
  subnet_ids = var.db_subnet_ids
  tags = {
    Name = "${var.name} DB Subnet Group"
  }
}

resource "aws_security_group" "this" {
  name   = "${var.name}-rds-sg"
  vpc_id = var.vpc_id

  ingress {
    protocol        = "tcp"
    from_port       = var.db_port
    to_port         = var.db_port
    security_groups = var.security_group_ids
  }

  ingress {
    protocol  = "tcp"
    from_port = var.db_port
    to_port   = var.db_port
    cidr_blocks = [
      "65.131.252.192/32", # Brennen MBP
    ]
    description = "Allow access from specified IP addresses"
  }

  ingress {
    protocol        = "tcp"
    from_port       = var.db_port
    to_port         = var.db_port
    security_groups = ["sg-0bde94ec34a1bccf9"]
    description     = "Allow access from bastion host"
  }

  egress {
    description = "Allow all outbound traffic"
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.name} RDS SG"
  }
}

resource "aws_db_instance" "this" {
  identifier                 = "${var.name}-db"
  engine                     = var.engine
  engine_version             = var.engine_version
  instance_class             = var.instance_class
  allocated_storage          = var.allocated_storage
  storage_type               = var.storage_type
  db_name                    = replace(var.name, "-", "_")
  username                   = var.username
  password                   = var.password
  db_subnet_group_name       = aws_db_subnet_group.this.name
  vpc_security_group_ids     = [aws_security_group.this.id]
  multi_az                   = var.multi_az
  publicly_accessible        = false
  auto_minor_version_upgrade = true
  backup_retention_period    = var.backup_retention_period
  maintenance_window         = var.maintenance_window
  skip_final_snapshot        = var.skip_final_snapshot
}
