import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { requireCustomer } from "~/utils/auth/loaders.server.js";
import { createLoaderLogger } from "~/utils/loaders.server.js";
import {
  actionWithDefaultErrorHandling,
  getActionIntent,
} from "~/utils/actions.server.js";
import { type Logger } from "~/logging/index.js";
import { requireTeamSlugRouteParam } from "~/utils/url/loaders.server.js";
import { useLoaderData } from "react-router";
import { createTeamInviteLink } from "~/utils/team-invite/core.server.js";
import { TeamQuerier } from "~/repositories/teams.server.js";
import { ManageMembers } from "./components/manage-members.js";
import { InviteLink } from "./components/invite-link.js";
import { requireTeamFromSlug } from "~/utils/team/loaders.js";
import {
  teamEmailInvites,
  teams,
  customers,
  customersToTeams,
  users,
} from "@acme/database/schema";
import { Separator } from "@www/ui/separator";
import { toggleInviteLink } from "./actions/toggle-invite-link.js";
import { refreshInviteLink } from "./actions/refresh-invite-link.js";
import { changeMemberRole } from "./actions/change-member-role.js";
import { leaveTeam } from "./actions/leave-team.js";
import { removeMember } from "./actions/remove-member.js";
import { sendEmailInvite } from "./actions/send-email-invite.js";
import { cancelEmailInvite } from "./actions/cancel-email-invite.js";
import { requireCustomerWithRole } from "~/utils/permissions/loaders.server.js";
import { UserRepository } from "~/repositories/users.server.js";
import { Alert, AlertDescription } from "@www/ui/alert";
import { CreditCard } from "lucide-react";

export const loader = async (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);
  const currentCustomer = await requireCustomer({
    args,
    logger,
    projection: { id: customers.id },
  });

  const teamSlug = requireTeamSlugRouteParam({
    params: args.params,
    logger,
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
    role: "member",
    logger,
    customerId: currentCustomer.id,
    teamId: team.id,
    errorMessage: "You don't have permission to access this team.",
  });

  const shareableInviteCode = team.shareableInviteCode;

  const teamQuerier = new TeamQuerier();
  const teamMemberRelations = await teamQuerier.queryCustomers({
    customerProjection: { id: customers.id, userId: customers.userId },
    customerToTeamsProjection: { role: customersToTeams.role },
    teamId: team.id,
  });

  const pendingMembers = (
    (await teamQuerier.queryEmailInvites({
      projection: {
        email: teamEmailInvites.email,
        role: teamEmailInvites.role,
        code: teamEmailInvites.code,
      },
      teamId: team.id,
    })) ?? []
  ).map((pendingMember) => {
    return {
      ...pendingMember,
      inviteLink: createTeamInviteLink(teamSlug, pendingMember.code),
    };
  });

  const members = await Promise.all(
    teamMemberRelations.map(async (relation) => {
      const userDetails = await fetchUser(relation.customer.userId);
      // TODO: clean this up
      return {
        role: relation.customer_to_customer_teams.role,
        email: userDetails?.email ?? "",
        name: userDetails?.name ?? "",
        imageUrl: userDetails?.imageUrl ?? null,
        customerId: relation.customer.id,
      };
    }),
  );

  return {
    canViewerManageMembers: members.some(
      (member) =>
        member.customerId === currentCustomer.id && member.role !== "member",
    ),
    currentCustomerId: currentCustomer.id,
    inviteLink:
      shareableInviteCode != null
        ? createTeamInviteLink(teamSlug, shareableInviteCode)
        : null,
    members,
    pendingMembers: pendingMembers ?? [],
  };
};

async function fetchUser(userId: string) {
  const userRepo = new UserRepository();
  const user = await userRepo.getQuerier().queryUser({
    projection: {
      name: users.name,
      email: users.email,
      imageUrl: users.imageUrl,
    },
    userId,
  });

  if (!user) return undefined;

  return {
    email: user.email || "No Email",
    name: `${user.name}` || "No Name",
    imageUrl: user.imageUrl,
  };
}

export enum SettingsMemberRouteIntent {
  TOGGLE_INVITE_LINK = "toggleInviteLink",
  REFRESH_INVITE_LINK = "refreshInviteLink",
  REMOVE_MEMBER = "removeMember",
  CHANGE_MEMBER_ROLE = "changeMemberRole",
  LEAVE_TEAM = "leaveTeam",
  SEND_EMAIL_INVITE = "sendEmailInvite",
  CANCEL_EMAIL_INVITE = "cancelEmailInvite",
}

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    const intent = await getActionIntent(args.request);

    if (intent === SettingsMemberRouteIntent.TOGGLE_INVITE_LINK)
      return await toggleInviteLink(args, logger);
    if (intent === SettingsMemberRouteIntent.REFRESH_INVITE_LINK)
      return await refreshInviteLink(args, logger);
    if (intent === SettingsMemberRouteIntent.REMOVE_MEMBER)
      return await removeMember(args, logger);
    if (intent === SettingsMemberRouteIntent.CHANGE_MEMBER_ROLE)
      return await changeMemberRole(args, logger);
    if (intent === SettingsMemberRouteIntent.LEAVE_TEAM)
      return await leaveTeam(args, logger);
    if (intent === SettingsMemberRouteIntent.SEND_EMAIL_INVITE)
      return await sendEmailInvite(args, logger);
    if (intent === SettingsMemberRouteIntent.CANCEL_EMAIL_INVITE)
      return await cancelEmailInvite(args, logger);
  },
);

export default function TeamMembersSettingsPage() {
  const loaderData = useLoaderData<typeof loader>();
  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 py-16">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Members</h2>
        <p className="text-muted-foreground">
          {loaderData.canViewerManageMembers
            ? "Manage who has access to this workspace"
            : "Members with access to this team. Admins can grant and revoke access."}
        </p>
      </div>
      {loaderData.canViewerManageMembers && (
        <Alert variant="default" className="bg-muted/50">
          <CreditCard className="h-4 w-4" />
          <AlertDescription className="flex items-center">
            New members will be prorated and billed immediately based on your
            current billing period. Removed members' seats remain available
            until the end of the billing cycle.
          </AlertDescription>
        </Alert>
      )}
      <Separator />
      {loaderData.canViewerManageMembers && (
        <>
          <InviteLink />
          <Separator />
        </>
      )}
      <ManageMembers />
    </div>
  );
}
