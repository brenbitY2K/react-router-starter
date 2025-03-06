export const RESERVED_PATHS = [
  // Root level routes
  "welcome",
  "u",
  "api",
  "select-team",
  "flow-selector",
  "select-account",
  "teams",
  "login",
  "signup",
  "add-account",
  "logout",
  "map",
  "form",
  "cloudinary",
  "webhook",

  // Nested routes that could conflict
  "teams-join",
  "teams-new",
  "teams-invite",

  // Auth related paths
  "google",
  "google-callback",

  // Settings and dashboard paths that shouldn't be team names
  "settings",
  "analytics",
  "reports",
  "billing",
  "account",
  "profile",
  "preferences",
  "security",
];
