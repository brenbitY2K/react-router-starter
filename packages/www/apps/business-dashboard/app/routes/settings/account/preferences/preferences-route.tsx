import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { type Logger } from "~/logging/index.js";
import {
  actionWithDefaultErrorHandling,
  getActionIntent,
} from "~/utils/actions.server.js";
import { requireCustomer } from "~/utils/auth/loaders.server.js";
import { createLoaderLogger } from "~/utils/loaders.server.js";
import { selectTheme } from "./actions/select-theme.js";
import { DEFAULT_THEME } from "~/root.js";
import { toggleNotifications } from "./actions/toggle-notifications.js";
import { CustomerQuerier } from "~/repositories/customers.server.js";
import { requireTeamSlugRouteParam } from "~/utils/url/loaders.server.js";
import { requireTeamFromSlug } from "~/utils/team/loaders.js";
import { ThemeSelector } from "./components/theme-selector.js";
import { Separator } from "@www/ui/separator";
import {
  customers,
  teamNotificationSettings,
  teams,
} from "@acme/database/schema";

export const loader = async (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);
  const customer = await requireCustomer({
    args,
    logger,
    projection: { activeTheme: customers.activeTheme, id: customers.id },
  });

  const teamSlug = requireTeamSlugRouteParam({
    params: args.params,
    logger,
  });

  const team = await requireTeamFromSlug({
    teamSlug,
    logger,
    projection: { id: teams.id },
  });

  const customerQuerier = new CustomerQuerier();

  const notificationSettings =
    await customerQuerier.queryTeamNotificationSettings({
      customerId: customer.id,
      teamId: team.id,
      projection: {
        notificationId: teamNotificationSettings.notificationId,
        enabled: teamNotificationSettings.emailEnabled,
      },
    });

  return {
    activeTheme: customer.activeTheme ?? DEFAULT_THEME,
    notificationSettings,
  };
};

export enum AccountPreferencesRouteIntent {
  SELECT_THEME = "account_preferences_route_intent_select_theme",
  TOGGLE_NOTIFICATIONS = "account_preferences_route_intent_toggle_notifications",
}

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    const intent = await getActionIntent(args.request);
    if (intent === AccountPreferencesRouteIntent.SELECT_THEME)
      return await selectTheme(args, logger);
    if (intent === AccountPreferencesRouteIntent.TOGGLE_NOTIFICATIONS)
      return await toggleNotifications(args, logger);
  },
);

export default function AccountPreferences() {
  return (
    <div className="min-h-screen w-full py-20 sm:px-8">
      <div className="mx-auto space-y-8 sm:max-w-2xl">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Preferences</h1>
          <p className="text-muted-foreground">Manage your preferences</p>
        </div>
        <Separator />
        <div className="space-y-4">
          <ThemeSelector />
        </div>
        {/* <NotificationSettings /> */}
      </div>
    </div>
  );
}
