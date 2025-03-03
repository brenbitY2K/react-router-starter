resource "aws_iam_role" "codebuild" {
  name = "${var.project_name}-codebuild-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
      }
    ]
  })
}

data "aws_iam_policy_document" "cloudwatch_logs" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      "arn:aws:logs:${var.aws_region}:${var.account_id}:log-group:/codebuild/${var.project_name}",
      "arn:aws:logs:${var.aws_region}:${var.account_id}:log-group:/codebuild/${var.project_name}:*"
    ]
  }
}

data "aws_iam_policy_document" "codebuild" {
  statement {
    effect = "Allow"
    actions = [
      "codebuild:CreateReportGroup",
      "codebuild:CreateReport",
      "codebuild:UpdateReport",
      "codebuild:BatchPutTestCases",
      "codebuild:BatchPutCodeCoverages"
    ]
    resources = [
      "arn:aws:codebuild:${var.aws_region}:${var.account_id}:report-group/${var.project_name}-*"
    ]
  }
}

data "aws_iam_policy_document" "ec2" {
  statement {
    effect = "Allow"
    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeDhcpOptions",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface",
      "ec2:DescribeSubnets",
      "ec2:DescribeSecurityGroups",
      "ec2:DescribeVpcs"
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "ec2:CreateNetworkInterfacePermission"
    ]
    resources = [
      "arn:aws:ec2:${var.aws_region}:${var.account_id}:network-interface/*"
    ]
    condition {
      test     = "StringEquals"
      variable = "ec2:Subnet"
      values   = [for subnet_id in var.subnet_ids : "arn:aws:ec2:${var.aws_region}:${var.account_id}:subnet/${subnet_id}"]
    }
    condition {
      test     = "StringEquals"
      variable = "ec2:AuthorizedService"
      values   = ["codebuild.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "base_policies" {
  source_policy_documents = [
    data.aws_iam_policy_document.cloudwatch_logs.json,
    data.aws_iam_policy_document.codebuild.json,
    data.aws_iam_policy_document.ec2.json
  ]
}

resource "aws_iam_policy" "base_policy" {
  name        = "${var.project_name}-codebuild-base-policy"
  description = "Base policy for CodeBuild project ${var.project_name}"
  policy      = data.aws_iam_policy_document.base_policies.json
}

resource "aws_iam_role_policy_attachment" "base_policy_attachment" {
  policy_arn = aws_iam_policy.base_policy.arn
  role       = aws_iam_role.codebuild.name
}

resource "aws_iam_role_policy_attachment" "additional_policies" {
  count      = length(var.additional_policy_arns)
  policy_arn = var.additional_policy_arns[count.index]
  role       = aws_iam_role.codebuild.name
}

resource "aws_iam_role_policy" "inline_policies" {
  for_each = var.inline_policy_documents
  name     = each.key
  role     = aws_iam_role.codebuild.id
  policy   = each.value
}
