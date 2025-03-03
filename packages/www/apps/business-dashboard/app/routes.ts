import { index, layout, prefix, route } from "@react-router/dev/routes";

export default [
  index("./routes/index.tsx"),
  route("welcome", "./routes/welcome/welcome-route.tsx"),
  route("welcome/role-selection", "./routes/welcome/role-selection-route.tsx"),

  // Helpers
  route("select-team", "./routes/select-team/select-team-route.tsx"),
  route("flow-selector", "./routes/flow-selector-route.tsx"),
  route("select-account", "./routes/auth/select-account-route.tsx"),

  route("teams/join", "./routes/teams/join-route.tsx"),

  route("teams/:teamSlug/invite", "./routes/teams/send-invite-route.tsx"),

  layout("./layouts/full-page-forms/multi-auth-layout.tsx", [
    route("teams/new", "./routes/teams/new-route.tsx"),
    route(
      "teams/:teamSlug/join/:inviteCode",
      "./routes/teams/accept-invite-route.tsx",
    ),
  ]),

  // Auth
  ...prefix("login", [
    index("./routes/auth/login/login-route.tsx"),
    route("google", "./routes/auth/login/google-oauth-redirect-route.tsx"),
    route(
      "google/callback",
      "./routes/auth/login/google-oauth-callback-route.tsx",
    ),
  ]),

  route("signup", "./routes/auth/signup/signup-route.tsx"),
  route("add-account", "./routes/auth/add-account/add-account-route.tsx"),
  route("logout", "./routes/auth/logout-route.tsx"),

  layout("./layouts/root-team-layout.tsx", [
    route(":teamSlug", "./layouts/dashboard/dashboard-layout.tsx", [
      index("./routes/dashboard/dashboard-route.tsx"),
    ]),
    ...prefix(":teamSlug/settings", [
      layout("./layouts/settings-layout.tsx", [
        route("general", "./routes/settings/general/general-route.tsx"),
        route("members", "./routes/settings/members/members-route.tsx"),
        route("billing", "./routes/settings/billing/billing-route.tsx", [
          route(
            "callback",
            "./routes/settings/billing/billing-callback-route.tsx",
          ),
          route(
            "success",
            "./routes/settings/billing/billing-success-route.tsx",
          ),
        ]),
        ...prefix("account", [
          route(
            "profile",
            "./routes/settings/account/profile/profile-route.tsx",
          ),
          route(
            "preferences",
            "./routes/settings/account/preferences/preferences-route.tsx",
          ),
          route(
            "security",
            "./routes/settings/account/security/security-route.tsx",
          ),
        ]),
      ]),
    ]),
  ]),

  route("/form", "./routes/api/form/route.tsx"),
  route("/cloudinary", "./routes/api/cloudinary/route.server.tsx"),
  route("/webhook/stripe", "./routes/api/webhooks/stripe-webhook-route.ts"),
];
