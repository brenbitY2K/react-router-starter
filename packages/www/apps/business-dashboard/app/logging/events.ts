export type LogEvent =
  | "customer_team_does_not_exist"
  | "customer_is_not_in_team"
  // Param not in path
  | "customer_team_slug_not_in_path"
  | "customer_team_invite_code_not_in_path"
  // Not exist
  | "customer_team_invite_code_does_not_exist"
  | "email_otp_does_not_exist"
  | "email_otp_link_token_invalid"
  | "account_with_email_does_not_exist"
  | "meta_integration_does_not_exist"
  | "meta_integration_customer_team_slug_not_specified"
  // Other
  | "customer_team_invite_code_not_valid"
  | "email_otp_expired"
  | "team_slug_conflicts_with_app_route"
  // Testing
  | "test"
  // Form
  | "form_validation_action_error"
  // Conflict
  | "email_already_in_use"
  | "username_already_in_use"
  | "team_slug_already_in_use"
  | "meta_integration_already_connected"
  // Subscription plan
  | "invalid_subscription_plan"
  // Stripe
  | "stripe_checkout_session_creation_failed"
  | "stripe_checkout_duplicate_subscription_attempted"
  | "stripe_missing_or_invalid_data"
  | "stripe_error"
  // External API failure
  | "ipapi_error"
  | "meta_error"
  // Email
  | "email_send_failed"
  // Error
  | "unknown"
  | "unauthorized"
  | "unauthenticated"
  | "user_with_no_connected_customer_account"
  | "bad_origin"
  | "required_table_does_not_exist";
