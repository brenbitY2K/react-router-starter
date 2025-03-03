import {
  type ActionFunctionArgs,
  redirect,
  type LoaderFunctionArgs,
} from "react-router";
import { type Logger } from "~/logging";
import {
  actionWithDefaultErrorHandling,
  getActionIntent,
} from "~/utils/actions.server";
import { createLoaderLogger } from "~/utils/loaders.server.js";
import { requireTeamSlugRouteParam } from "~/utils/url/loaders.server.js";
import { selectTeam } from "./actions/select-team";
import { routeToNewTeamPage } from "./actions/create-team";

export const loader = async (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);

  const teamSlug = requireTeamSlugRouteParam({
    params: args.params,
    logger,
  });

  throw redirect(`/${teamSlug}/map`);
};

export enum TeamSlugDashboardRouteIntent {
  SELECT_TEAM = "customer_team_slug_layout_select_theme",
  ROUTE_TO_NEW_TEAM_PAGE = "customer_team_slug_layout_route_to_new_team_page",
}

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    const intent = await getActionIntent(args.request);

    if (intent === TeamSlugDashboardRouteIntent.SELECT_TEAM)
      return await selectTeam(args, logger);
    if (intent === TeamSlugDashboardRouteIntent.ROUTE_TO_NEW_TEAM_PAGE)
      return await routeToNewTeamPage(args, logger);
  },
);
