import type { Route, Info } from "./+types/dashboard-layout";
import { Form, Link, Outlet, useLoaderData, useLocation } from "react-router";
import { CoreApplicationShell } from "@www/ui/components/core-app-shell";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@www/ui/menubar";
import {
  OrganizationLogo,
  OrganizationLogoFallback,
  OrganizationLogoImage,
} from "@www/ui/organization-logo";
import { ChartArea, ChevronDown, FileText, Map } from "lucide-react";
import { type LoaderFunctionArgs, data } from "react-router";
import { createLoaderLogger } from "~/utils/loaders.server.js";
import { requireCustomer } from "~/utils/auth/loaders.server.js";
import { requireTeamSlugRouteParam } from "~/utils/url/loaders.server.js";
import { CustomerQuerier } from "~/repositories/customers.server.js";
import {
  customers,
  customersToTeams,
  teams,
} from "@acme/database/schema";
import { getAllSessionsAndInvalidateStaleOnes } from "~/utils/auth/core.server.js";
import { getAllTeamsByCustomerUser } from "~/utils/team/core.server.js";
import { UserQuerier } from "~/repositories/users.server.js";
import { throwUnauthorizedErrorResponseJsonAndLog } from "~/utils/response.server.js";
import { generateImageFallbackText } from "~/utils/images.js";
import { SessionRepository } from "~/repositories/sessions.server.js";
import { Button } from "@www/ui/button";
import { TeamSlugDashboardRouteIntent } from "~/routes/dashboard/dashboard-route";

export const loader = async (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);

  const teamSlug = requireTeamSlugRouteParam({
    params: args.params,
    logger,
  });

  const { users: allActiveUserSessions, setCookieHeaders } =
    await getAllSessionsAndInvalidateStaleOnes({
      sessionRepo: new SessionRepository(),
      cookieHeader: args.request.headers.get("Cookie"),
      userQuerier: new UserQuerier(),
    });

  const customer = await requireCustomer({
    args,
    logger,
    projection: { id: customers.id, userId: customers.userId },
  });

  const customerQuerier = new CustomerQuerier();
  const teamRelations = await customerQuerier.queryTeams({
    teamProjection: {
      slug: teams.slug,
      name: teams.name,
      id: teams.id,
      imageUrl: teams.imageUrl,
    },
    customerId: customer.id,
    customerToTeamsProjection: { role: customersToTeams.role },
  });

  const activeTeamRelation = teamRelations.find((relation) => {
    return relation.customer_team.slug === teamSlug;
  });

  if (activeTeamRelation == null) {
    throw throwUnauthorizedErrorResponseJsonAndLog({
      data: { message: "You do not have access to this customer team." },
      logInfo: {
        logger,
        event: "customer_is_not_in_team",
      },
    });
  }

  const teamsByCustomerUser = await getAllTeamsByCustomerUser({
    usersWithActiveSession: allActiveUserSessions,
    userQuerier: new UserQuerier(),
  });

  return data(
    {
      teams: teamRelations.map((relation) => ({
        id: relation.customer_team.id,
        name: relation.customer_team.name,
        slug: relation.customer_team.slug,
        imageUrl: relation.customer_team.imageUrl,
      })),
      activeTeam: {
        id: activeTeamRelation.customer_team.id,
        name: activeTeamRelation.customer_team.name,
        slug: activeTeamRelation.customer_team.slug,
        imageUrl: activeTeamRelation.customer_team.imageUrl,
      },
      teamsByCustomerUser,
      currentCustomerId: customer.id,
      currentCustomerEmail:
        allActiveUserSessions.filter(
          (session) => session.id === customer.userId,
        )[0]?.email ?? "",
    },
    { headers: [...setCookieHeaders] },
  );
};

export function TeamMenu() {
  const { activeTeam, teamsByCustomerUser, currentCustomerId } =
    useLoaderData<typeof loader>();
  const location = useLocation();

  return (
    <Menubar className="bg-base-100 border-none">
      <MenubarMenu>
        <MenubarTrigger className="hover:bg-base-300 focus:bg-base-300 data-[state=open]:bg-base-200 p-1">
          <div className="flex items-center space-x-2">
            <OrganizationLogo className="size-6">
              <OrganizationLogoImage src={activeTeam.imageUrl ?? undefined} />
              <OrganizationLogoFallback className="text-[10px]">
                {generateImageFallbackText(activeTeam.name)}
              </OrganizationLogoFallback>
            </OrganizationLogo>
            <p className="text-foreground max-w-[230px] overflow-hidden text-ellipsis whitespace-nowrap text-sm">
              {activeTeam.name}
            </p>
            <ChevronDown className="size-4" />
          </div>
        </MenubarTrigger>
        <MenubarContent>
          <Link
            to={`/${activeTeam.slug}/settings/account/profile`}
            state={{ fromPathName: location.pathname }}
          >
            <MenubarItem>Account settings</MenubarItem>
          </Link>
          <MenubarSeparator />
          <Link
            to={`/${activeTeam.slug}/settings/general`}
            state={{ fromPathName: location.pathname }}
          >
            <MenubarItem>Team settings</MenubarItem>
          </Link>
          <Link
            to={`/${activeTeam.slug}/settings/members`}
            state={{ fromPathName: location.pathname }}
          >
            <MenubarItem>Invite and manage members</MenubarItem>
          </Link>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Switch teams</MenubarSubTrigger>
            <MenubarSubContent>
              {teamsByCustomerUser.map((customer) => (
                <div key={customer.customerId}>
                  <p className="text-muted-foreground px-8 pt-2 text-sm">
                    {customer.email}
                  </p>
                  {customer.teams.length > 0 ? (
                    customer.teams.map((team) => (
                      <Form key={team.id} method="POST">
                        <input
                          type="hidden"
                          name="intent"
                          value={TeamSlugDashboardRouteIntent.SELECT_TEAM}
                        />
                        <input
                          type="hidden"
                          name="teamSlug"
                          value={team.slug}
                        />
                        <input
                          type="hidden"
                          name="userId"
                          value={customer.userId}
                        />

                        <MenubarCheckboxItem
                          checked={
                            team.id === activeTeam.id &&
                            customer.customerId === currentCustomerId
                          }
                          onClick={(e) =>
                            e.currentTarget.closest("form")?.submit()
                          }
                        >
                          {team.name}
                        </MenubarCheckboxItem>
                      </Form>
                    ))
                  ) : (
                    <Form method="POST">
                      <input
                        type="hidden"
                        name="intent"
                        value={
                          TeamSlugDashboardRouteIntent.ROUTE_TO_NEW_TEAM_PAGE
                        }
                      />
                      <input
                        type="hidden"
                        name="userId"
                        value={customer.userId}
                      />
                      <MenubarItem
                        inset
                        onClick={(e) =>
                          e.currentTarget.closest("form")?.submit()
                        }
                      >
                        Create a team
                      </MenubarItem>
                    </Form>
                  )}
                </div>
              ))}
              <MenubarSeparator />
              <Link to="/teams/new">
                <MenubarItem>Create a team</MenubarItem>
              </Link>
              <Link to="/add-account">
                <MenubarItem>Add an account</MenubarItem>
              </Link>
            </MenubarSubContent>
          </MenubarSub>
          <Link
            to={`/logout?mode=currentAccount`}
            state={{ fromPathName: location.pathname }}
          >
            <MenubarItem>Log out</MenubarItem>
          </Link>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

function DefaultSideNavContent({
  loaderData,
}: {
  loaderData: Info["loaderData"];
}) {
  const showInternalRoutes =
    loaderData.currentCustomerEmail.endsWith("@acme.ai");
  const location = useLocation();
  return (
    <div>
      <TeamMenu />
      <div className="mt-4 flex flex-col gap-0.5">
        <Link
          to={`/${loaderData.activeTeam.slug}/map`}
          state={{ fromPathName: location.pathname }}
        >
          <Button
            variant="ghost"
            className="text-foreground group h-8 w-full justify-start gap-2 px-2 text-sm font-normal"
          >
            <Map className="text-muted-foreground group-hover:text-foreground mr-2 h-4 w-4" />
            Map
          </Button>
        </Link>
        <Link
          to={`/${loaderData.activeTeam.slug}/reports`}
          state={{ fromPathName: location.pathname }}
        >
          <Button
            variant="ghost"
            className="text-foreground group h-8 w-full justify-start gap-2 px-2 text-sm font-normal"
          >
            <FileText className="text-muted-foreground group-hover:text-foreground mr-2 h-4 w-4" />
            Reports
          </Button>
        </Link>
        <Link
          to={`/${loaderData.activeTeam.slug}/analytics`}
          state={{ fromPathName: location.pathname }}
        >
          <Button
            variant="ghost"
            className="text-foreground group h-8 w-full justify-start gap-2 px-2 text-sm font-normal"
          >
            <ChartArea className="text-muted-foreground group-hover:text-foreground mr-2 h-4 w-4" />
            Analytics
          </Button>
        </Link>
        {showInternalRoutes ? (
          <div className="mt-6">
            <p className="text-muted-foreground mb-2 px-2 text-xs font-medium uppercase">
              Internal
            </p>
            <div className="flex flex-col gap-0.5">
              <Link
                to={`/internal/${loaderData.activeTeam.slug}/map-2`}
                state={{ fromPathName: location.pathname }}
              >
                <Button
                  variant="ghost"
                  className="text-foreground group h-8 w-full justify-start gap-2 px-2 text-sm font-normal"
                >
                  <Map className="text-muted-foreground group-hover:text-foreground mr-2 h-4 w-4" />
                  Map 2.0
                </Button>
              </Link>
              <Link
                to={`/internal/${loaderData.activeTeam.slug}/teams`}
                state={{ fromPathName: location.pathname }}
              >
                <Button
                  variant="ghost"
                  className="text-foreground group h-8 w-full justify-start gap-2 px-2 text-sm font-normal"
                >
                  <FileText className="text-muted-foreground group-hover:text-foreground mr-2 h-4 w-4" />
                  Team Management
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <CoreApplicationShell
        sideNavConent={<DefaultSideNavContent loaderData={loaderData} />}
        mainContent={<Outlet />}
      />
    </div>
  );
}
