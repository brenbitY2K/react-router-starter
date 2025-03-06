import { customers } from "@acme/database/schema";
import { Button } from "@www/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@www/ui/card";
import {
  OrganizationLogo,
  OrganizationLogoFallback,
  OrganizationLogoImage,
} from "@www/ui/organization-logo";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import {
  type ActionFunctionArgs,
  data,
  type LoaderFunctionArgs,
} from "react-router";
import { ArrowRightIcon } from "lucide-react";
import { type Logger } from "~/logging/index.js";
import {
  actionWithDefaultErrorHandling,
  getActionIntent,
} from "~/utils/actions.server.js";
import { getAllSessionsAndInvalidateStaleOnes } from "~/utils/auth/core.server.js";
import { requireCustomer } from "~/utils/auth/loaders.server.js";
import { createLoaderLogger } from "~/utils/loaders.server.js";
import { selectTeam } from "./actions/select-team.js";
import { useActionErrorToast } from "~/hooks/action.js";
import { getAllTeamsByCustomerUser } from "~/utils/team/core.server.js";
import { UserQuerier } from "~/repositories/users.server.js";
import { generateImageFallbackText } from "~/utils/images.js";
import { SessionRepository } from "~/repositories/sessions.server.js";

export const loader = async (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);

  const { users: allActiveUserSessions, setCookieHeaders } =
    await getAllSessionsAndInvalidateStaleOnes({
      sessionRepo: new SessionRepository(),
      cookieHeader: args.request.headers.get("Cookie"),
      userQuerier: new UserQuerier(),
    });

  const customer = await requireCustomer({
    args,
    logger,
    projection: { id: customers.id },
  });

  const teamsByCustomerUser = await getAllTeamsByCustomerUser({
    usersWithActiveSession: allActiveUserSessions,
    userQuerier: new UserQuerier(),
  });

  return data(
    {
      teamsByCustomerUser,
      currentCustomerId: customer.id,
    },
    { headers: [...setCookieHeaders] },
  );
};

export enum SelectTeamRouteIntent {
  SELECT_TEAM = "select_team_route_intent_select_team",
}

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    const intent = await getActionIntent(args.request);

    if (intent === SelectTeamRouteIntent.SELECT_TEAM)
      return await selectTeam(args, logger);
  },
);

export default function SelectTeam() {
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();

  useActionErrorToast(actionData);

  return (
    <div className="bg-base-100 flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Select a Team</CardTitle>
          <CardDescription>
            Select a team below or create a new team to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[400px] overflow-scroll">
          <div className="grid gap-4">
            {loaderData.teamsByCustomerUser.map((customer) => (
              <>
                <p className="text-muted-foreground pt-2 text-sm">
                  {customer.email}
                </p>

                {customer.teams.map((team) => (
                  <Form key={team.id} className="w-full" method="POST">
                    <input
                      type="hidden"
                      value={customer.userId}
                      name="userId"
                    />
                    <input type="hidden" value={team.slug} name="teamSlug" />
                    <input
                      type="hidden"
                      value={SelectTeamRouteIntent.SELECT_TEAM}
                      name="intent"
                    />
                    <button
                      className="bg-muted hover:bg-muted/50 flex w-full cursor-pointer items-center justify-between rounded-md px-4 py-3 transition-colors"
                      type="submit"
                    >
                      <div className="flex items-center gap-3">
                        <OrganizationLogo className="h-10 w-10">
                          <OrganizationLogoImage
                            src={team.imageUrl ?? undefined}
                          />
                          <OrganizationLogoFallback>
                            {generateImageFallbackText(team.name)}
                          </OrganizationLogoFallback>
                        </OrganizationLogo>
                        <div className="flex flex-col items-start">
                          <div className="font-medium">{team.name}</div>
                          <div className="text-muted-foreground text-sm">
                            {team.slug}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        type="submit"
                        loading={
                          navigation.formData?.get("userId") === team.id &&
                          navigation.state !== "idle"
                        }
                      >
                        <ArrowRightIcon className="h-5 w-5" />
                      </Button>
                    </button>
                  </Form>
                ))}
              </>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Link to="/teams/new">
            <Button variant="outline" className="mt-4">
              Create new team
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
