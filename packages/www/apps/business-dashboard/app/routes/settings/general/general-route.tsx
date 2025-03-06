import { teams } from "@acme/database/schema";
import { Separator } from "@www/ui/separator";
import { Button } from "@www/ui/button";
import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { type Logger } from "~/logging/index.js";
import {
  actionWithDefaultErrorHandling,
  getActionIntent,
} from "~/utils/actions.server.js";
import { createLoaderLogger } from "~/utils/loaders.server.js";
import { requireTeamFromSlug } from "~/utils/team/loaders.js";
import { requireTeamSlugRouteParam } from "~/utils/url/loaders.server.js";
import { updateGeneral } from "./actions/update-general.js";
import { UpdateGeneralSettings } from "./components/update-general.js";
import { TeamLogoSection } from "./components/logo-uploader.js";
import { updateTeamLogo } from "./actions/update-team-logo.js";

export const loader = async (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);

  const teamSlug = requireTeamSlugRouteParam({
    params: args.params,
    logger,
  });

  const team = await requireTeamFromSlug({
    teamSlug,
    logger,
    projection: {
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
      imageUrl: teams.imageUrl,
    },
  });

  return {
    teamName: team.name,
    teamSlug: team.slug,
    teamImageUrl: team.imageUrl,
    teamId: team.id,
  };
};

export enum SettingsGeneralRouteIntent {
  UPDATE_GENERAL = "updateGeneral",
  UPDATE_LOGO = "updateLogo",
}

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    const intent = await getActionIntent(args.request);

    if (intent === SettingsGeneralRouteIntent.UPDATE_GENERAL)
      return await updateGeneral(args, logger);

    if (intent === SettingsGeneralRouteIntent.UPDATE_LOGO)
      return await updateTeamLogo(args, logger);
  },
);

export default function GeneralSettings() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-muted-foreground">Manage your team settings</p>
      </div>
      <Separator />
      <TeamLogoSection />
      <Separator />
      <UpdateGeneralSettings />
    </div>
  );
}
