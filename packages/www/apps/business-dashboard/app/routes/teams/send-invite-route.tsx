import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@www/ui/card";
import { Button } from "@www/ui/button";
import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  redirect,
} from "react-router";
import { requireCustomer } from "~/utils/auth/loaders.server.js";
import { validateCustomer } from "~/utils/auth/actions.server.js";
import { validateCustomerHasRole } from "~/utils/permissions/actions.server.js";
import { requireCustomerWithRole } from "~/utils/permissions/loaders.server.js";
import { createLoaderLogger } from "~/utils/loaders.server.js";
import { useState } from "react";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useParams,
} from "react-router";
import { z } from "zod";
import {
  actionWithDefaultErrorHandling,
  sendFormValidationErrorJson,
  validateFormData,
} from "~/utils/actions.server.js";
import { createTeamInviteLink } from "~/utils/team-invite/core.server.js";
import { EmailService } from "~/services/email/email.server.js";
import { useActionErrorToast } from "~/hooks/action.js";
import { type Logger } from "~/logging/index.js";
import { requireTeamSlugRouteParam } from "~/utils/url/loaders.server.js";
import { validateTeamSlugRouteParam } from "~/utils/url/actions.server.js";
import { requireTeamFromSlug } from "~/utils/team/loaders.js";
import { validateTeamFromSlug } from "~/utils/team/actions.js";
import { teams, customers, users } from "@acme/database/schema";
import { TeamRepository } from "~/repositories/teams.server.js";
import { TeamMemberService } from "~/services/team-members.server.js";
import {
  SendEmailInviteFormContent,
  ShareableInviteLinkCopier,
} from "~/components/team-invite.js";
import { isFormValidationActionError } from "~/utils/response.js";
import { UserQuerier } from "~/repositories/users.server";
import { PostmarkEmailClient } from "~/services/email/postmark-client.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);

  const teamSlug = requireTeamSlugRouteParam({
    params: args.params,
    logger,
  });

  const customer = await requireCustomer({
    args,
    logger,
    projection: { id: customers.id },
  });

  const team = await requireTeamFromSlug({
    teamSlug,
    logger,
    projection: {
      id: teams.id,
      shareableInviteCode: teams.shareableInviteCode,
    },
  });

  await requireCustomerWithRole({
    customerId: customer.id,
    teamId: team.id,
    role: "admin",
    logger,
    errorMessage: "You don't have permission to invite members to this team.",
  });

  const shareableInvitationCode = team.shareableInviteCode;

  return {
    link: shareableInvitationCode
      ? createTeamInviteLink(teamSlug, shareableInvitationCode)
      : null,
  };
};

const inviteToTeamSchema = z.object({
  emails: z
    .string()
    .transform((val: string) => val.split(/,\s*/))
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

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    const customer = await validateCustomer({
      args,
      logger,
      projection: { id: customers.id, userId: customers.userId },
    });

    const teamSlug = validateTeamSlugRouteParam({
      params: args.params,
      logger,
    });

    const parsed = await validateFormData({
      schema: inviteToTeamSchema,
      request: args.request,
    });

    if (!parsed.success) {
      return sendFormValidationErrorJson(parsed);
    }

    const team = await validateTeamFromSlug({
      teamSlug,
      logger,
      projection: {
        id: teams.id,
        name: teams.name,
        slug: teams.slug,
      },
    });

    await validateCustomerHasRole({
      teamId: team.id,
      customerId: customer.id,
      role: "admin",
      errorMessage: "You don't have permission to invite people to this team.",
      logger,
    });

    const emails = parsed.data.emails;

    const teamMemberService = new TeamMemberService({
      logger,
      teamRepo: new TeamRepository(),
    });

    const user = await new UserQuerier().queryUser({
      userId: customer.userId,
      projection: { name: users.name },
    });

    await teamMemberService.sendEmailInvitations({
      emailService: new EmailService(new PostmarkEmailClient()),
      emails,
      team,
      role: parsed.data.role,
      senderCustomerName: user?.name ?? "Someone",
    });

    throw redirect(`/${teamSlug}`);
  },
);

export default function TeamInvite() {
  const { link } = useLoaderData<typeof loader>();
  const params = useParams();
  const teamSlug = params["teamSlug"];
  const actionData = useActionData<typeof action>();
  const [mode, setMode] = useState<"link" | "email">("link");

  useActionErrorToast(actionData);

  return (
    <div className="bg-base-100 flex h-screen flex-col items-center justify-center">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Invite co-workers to your team</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Acme is better with friends!{" "}
          </p>
        </div>
        <Card className="bg-base-200">
          <Form method="POST">
            <CardContent className="p-7">
              <CardTitle className="text-md">
                {mode === "link" ? "Invite link" : "Invite with email"}
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                {mode === "link"
                  ? "Share this link with others you'd like to join your team."
                  : "Invite others to your team via email. Enter emails in a comma separated list."}
              </CardDescription>
              <div className="mt-4 flex items-center space-x-3">
                {mode === "link" ? (
                  link !== null ? (
                    <ShareableInviteLinkCopier link={link} />
                  ) : (
                    <p className="text-muted-foreground text-center">
                      This team has disabled shareable links. Please invite with
                      email instead.
                    </p>
                  )
                ) : (
                  <SendEmailInviteFormContent
                    errors={
                      isFormValidationActionError(actionData)
                        ? actionData.formValidationError.emails?._errors
                        : undefined
                    }
                  />
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between px-7">
              <Button
                className="text-primary"
                variant="ghost"
                type="button"
                onClick={() => setMode(mode === "link" ? "email" : "link")}
              >
                {mode === "link" ? "Invite with email" : "Invite with link"}
              </Button>
              {mode === "email" && <Button type="submit">Send invites</Button>}
            </CardFooter>
          </Form>
        </Card>
        <Link to={`/${teamSlug}`}>
          <Button className="mt-4 w-full" variant="secondary">
            Continue
          </Button>
        </Link>
      </div>
    </div>
  );
}
