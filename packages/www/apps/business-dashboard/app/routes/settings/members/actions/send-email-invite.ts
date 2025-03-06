import { data, type ActionFunctionArgs } from "react-router";
import {
  sendFormValidationErrorJson,
  validateFormData,
} from "~/utils/actions.server.js";
import { loggerWithNamedActionInfo, type Logger } from "~/logging/index.js";
import { requireTeamSlugRouteParam } from "~/utils/url/loaders.server.js";
import { validateCustomerHasRole } from "~/utils/permissions/actions.server.js";
import { z } from "zod";
import { TeamRepository } from "~/repositories/teams.server.js";
import {
  teams,
  customers,
  subscriptions,
  users,
} from "@acme/database/schema";
import { validateTeamFromSlug } from "~/utils/team/actions.js";
import { validateCustomer } from "~/utils/auth/actions.server.js";
import { TeamMemberService } from "~/services/team-members.server.js";
import { SettingsMemberRouteIntent } from "../members-route.js";
import { EmailService } from "~/services/email/email.server.js";
import { validateTeamHasSubscription } from "~/utils/subscription/actions.server.js";
import { PostmarkEmailClient } from "~/services/email/postmark-client.server.js";
import { UserQuerier } from "~/repositories/users.server.js";

const sendEmailInviteSchema = z.object({
  emails: z
    .string()
    .transform((val: string) => val.split(/,\s*/).map((email) => email.trim()))
    .refine(
      (emails: string[]) =>
        emails.every((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
      {
        message:
          "Each value must be a valid email address. Make sure to remove trailing spaces and trailing commas.",
      },
    ),
  role: z.enum(["owner", "admin", "member"], {
    message: "Please select a valid role.",
  }),
});

export async function sendEmailInvite(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    SettingsMemberRouteIntent.SEND_EMAIL_INVITE,
  );

  const customer = await validateCustomer({
    args,
    logger,
    projection: { id: customers.id, userId: customers.userId },
  });

  const teamSlug = requireTeamSlugRouteParam({
    params: args.params,
    logger,
  });

  const formData = await args.request.formData();

  const parsed = await validateFormData({
    schema: sendEmailInviteSchema,
    formData,
  });

  if (!parsed.success) {
    return sendFormValidationErrorJson(parsed);
  }

  const team = await validateTeamFromSlug({
    teamSlug,
    logger,
    projection: {
      id: teams.id,
      slug: teams.slug,
      name: teams.name,
    },
  });

  await validateTeamHasSubscription({
    teamId: team.id,
    projection: {
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      subscriptionItemId: subscriptions.subscriptionItemId,
      currentPeriodSeats: subscriptions.currentPeriodSeats,
    },
    errorMessage:
      "You must have an active subscription to invite members to your team.",
    logger,
  });

  await validateCustomerHasRole({
    customerId: customer.id,
    teamId: team.id,
    role: "admin",
    logger,
    errorMessage: "You don't have permission to invite members.",
  });

  const teamRepo = new TeamRepository();
  const teamMemberService = new TeamMemberService({
    teamRepo,
    logger,
  });

  const user = await new UserQuerier().queryUser({
    userId: customer.userId,
    projection: { name: users.name },
  });

  await teamMemberService.sendEmailInvitations({
    team,
    emails: parsed.data.emails,
    role: parsed.data.role,
    emailService: new EmailService(new PostmarkEmailClient()),
    // This is not going to be undefined, but I'm too lazy
    // to do proper checks.
    senderCustomerName: user?.name ?? "Someone",
  });

  return data({ success: true }, { status: 200 });
}
