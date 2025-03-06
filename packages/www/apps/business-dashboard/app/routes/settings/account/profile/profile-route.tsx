import type { Route } from "./+types/profile-route";
import {
  emailOTPsForEmailChange,
  oauthAccounts,
  customers,
  users,
} from "@acme/database/schema";
import { data, type ActionFunctionArgs } from "react-router";
import {
  requireCustomer,
  requireUserFromSession,
} from "~/utils/auth/loaders.server.js";
import { createLoaderLogger } from "~/utils/loaders.server.js";
import { ProfileCard } from "./components/profile-card.js";
import { ConnectedAccountsCard } from "./components/connected-accounts-card.js";
import {
  actionWithDefaultErrorHandling,
  getActionIntent,
} from "~/utils/actions.server.js";
import { type Logger } from "~/logging/index.js";
import { checkForExistingEmail } from "./actions/check-for-existing-email.js";
import { getDataFromEmailChangeJWTOrThrow } from "./utils.js";
import { EmailOTPAuthService } from "~/services/email-otp-auth.server.js";
import {
  EmailOTPQuerier,
  EmailOTPRepository,
} from "~/repositories/email-otps.server.js";
import {
  throwErrorResponseJsonAndLog,
  throwNotFoundErrorResponseJsonAndLog,
} from "~/utils/response.server.js";
import { UserQuerier, UserRepository } from "~/repositories/users.server.js";
import { getToast, redirectWithSuccess } from "remix-toast";
import { requireTeamSlugRouteParam } from "~/utils/url/loaders.server.js";
import { useEffect } from "react";
import { toast } from "sonner";
import { cancelOngoingEmailChange } from "./actions/cancel-ongoing-email-change.js";
import { updateCoreProfileInfo } from "./actions/update-core-profile-info.js";
import { disconnectConnectedAccount } from "./actions/disonnect-connected-account.js";
import { updateProfilePicture } from "./actions/update-profile-picture.js";

export const loader = async (args: Route.LoaderArgs) => {
  const logger = createLoaderLogger(args);
  const token = new URL(args.request.url).searchParams.get("emailChangeToken");

  const customer = await requireCustomer({
    args,
    logger,
    projection: { id: customers.id, userId: customers.userId },
  });

  if (token) {
    const { code } = getDataFromEmailChangeJWTOrThrow({ logger, token });
    const authService = new EmailOTPAuthService({
      logger,
      emailOTPRepository: new EmailOTPRepository(),
    });

    const newEmail = await authService.verifyEmailOTPForEmailChange({
      code,
      userRepo: new UserRepository(),
      userId: customer.userId,
      emailAlreadyInUseThrower: () => {
        throw throwErrorResponseJsonAndLog({
          init: { status: 409 },
          data: {
            message:
              "The email address you're attempting to change to is already in use.",
          },
          logInfo: { logger, event: "email_already_in_use" },
        });
      },
      expiredCodeThrower: () => {
        throw throwNotFoundErrorResponseJsonAndLog({
          data: { message: "This email change link has expired." },
          logInfo: { logger, event: "email_otp_link_token_invalid" },
        });
      },
      invalidCodeThrower: () => {
        throw throwNotFoundErrorResponseJsonAndLog({
          data: { message: "This email change link is invalid." },
          logInfo: { logger, event: "email_otp_link_token_invalid" },
        });
      },
    });

    const teamSlug = requireTeamSlugRouteParam({
      params: args.params,
      logger,
    });

    redirectWithSuccess(`/${teamSlug}/settings/account/profile`, {
      message: `Your email has been updated to ${newEmail}`,
    });
  }

  const user = await requireUserFromSession({
    args,
    logger,
    projection: {
      id: users.id,
      email: users.email,
      name: users.name,
      imageUrl: users.imageUrl,
      username: users.username,
    },
  });

  const existingEmailChangeOTP =
    await new EmailOTPQuerier().queryEmailOTPForEmailChangeByUserId({
      userId: user.id,
      projection: { id: emailOTPsForEmailChange.id },
    });

  const { toast, headers } = await getToast(args.request);

  const connectedAccounts = await new UserQuerier().queryOAuthAccounts({
    userId: customer.userId,
    projection: {
      providerId: oauthAccounts.providerId,
      providerEmail: oauthAccounts.providerEmail,
    },
  });

  const googleAccount = connectedAccounts
    .filter((account) => account.providerId === "google")
    .map((account) => ({ email: account.providerEmail }))
    .shift();

  return data(
    {
      toast,
      userId: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      imageUrl: user.imageUrl,
      emailChangeRequestAlreadyExists: existingEmailChangeOTP !== undefined,
      connectedAccounts: {
        google: googleAccount,
      },
    },
    { headers },
  );
};

export enum SettingsAccountProfileRouteIntent {
  CHECK_FOR_EXISTING_EMAIL = "settings_account_profile_route_intent_check_for_existing_email",
  CANCEL_ONGOING_EMAIL_CHANGE = "settings_account_profile_route_intent_cancel_ongoing_email_change",
  UPDATE_CORE_PROFILE_INFO = "settings_account_profile_route_intent_update_core_profile_info",
  DISCONNECT_CONNECTED_ACCOUNT = "settings_account_profile_route_intent_disconnect_connected_account",
  UPDATE_PROFILE_PICTURE = "settings_account_profile_route_intent_update_profile_picture",
}

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    const intent = await getActionIntent(args.request);

    if (intent === SettingsAccountProfileRouteIntent.CHECK_FOR_EXISTING_EMAIL)
      return await checkForExistingEmail(args, logger);
    if (
      intent === SettingsAccountProfileRouteIntent.CANCEL_ONGOING_EMAIL_CHANGE
    )
      return await cancelOngoingEmailChange(args, logger);
    if (intent === SettingsAccountProfileRouteIntent.UPDATE_CORE_PROFILE_INFO)
      return await updateCoreProfileInfo(args, logger);
    if (
      intent === SettingsAccountProfileRouteIntent.DISCONNECT_CONNECTED_ACCOUNT
    )
      return await disconnectConnectedAccount(args, logger);
    if (intent === SettingsAccountProfileRouteIntent.UPDATE_PROFILE_PICTURE)
      return await updateProfilePicture(args, logger);
  },
);

export default function AccountProfileSettingsPage({
  loaderData,
}: Route.ComponentProps) {
  useEffect(() => {
    if (loaderData.toast?.type === "success") {
      toast.success(loaderData.toast.message);
    }
    if (loaderData.toast?.type === "error") {
      toast.error(loaderData.toast.message);
    }
  }, [loaderData.toast]);

  return (
    <div className="min-h-screen w-full py-20 sm:px-8">
      <div className="mx-auto space-y-8 sm:max-w-2xl">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your Acme profile
          </p>
        </div>
        <ProfileCard />
        <ConnectedAccountsCard
          connectedAccounts={loaderData.connectedAccounts}
        />
      </div>
    </div>
  );
}
