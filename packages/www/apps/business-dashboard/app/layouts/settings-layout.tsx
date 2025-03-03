import type { Route, Info } from "./+types/settings-layout";
import { Link, Outlet, redirect, useLocation, useParams } from "react-router";
import { CoreApplicationShell } from "@www/ui/components/core-app-shell";
import { ChevronLeft, Building2Icon, CircleUser } from "lucide-react";
import { type LoaderFunctionArgs } from "react-router";
import { validateCustomer } from "~/utils/auth/actions.server";
import { validateTeamSlugRouteParam } from "~/utils/url/actions.server";
import {
  customers,
  customersToTeams,
  teams,
} from "@acme/database/schema";
import { createLoaderLogger } from "~/utils/loaders.server";
import { TeamRepository } from "~/repositories/teams.server";
import { validateTeamFromSlug } from "~/utils/team/actions";

export const loader = async (args: LoaderFunctionArgs) => {
  const url = new URL(args.request.url);
  if (url.pathname === `/${args.params["teamSlug"]}/settings`) {
    throw redirect(`/${args.params["teamSlug"]}/settings/general`);
  }

  const logger = createLoaderLogger(args);

  const customer = await validateCustomer({
    args,
    logger,
    projection: { id: customers.id },
  });

  const teamSlug = validateTeamSlugRouteParam({
    params: args.params,
    logger,
  });

  const team = await validateTeamFromSlug({
    teamSlug,
    logger,
    projection: {
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
    },
  });

  const teamRepo = new TeamRepository();

  const customerToTeamRelation = await teamRepo
    .getQuerier()
    .queryCustomerToTeamRelation({
      teamId: team.id,
      customerId: customer.id,
      projection: { role: customersToTeams.role },
    });

  return { role: customerToTeamRelation?.role ?? null };
};

function SettingsSideNavContent({ role }: Pick<Info["loaderData"], "role">) {
  const location = useLocation();
  const params = useParams();
  const teamSlug = params["teamSlug"];
  const fromPathName = location.state?.fromPathName ?? `/${teamSlug}/`;

  return (
    <div className="p-1">
      <Link
        to={fromPathName}
        className="flex cursor-default items-center space-x-3"
      >
        <ChevronLeft className="text-muted-foreground hover:text-foreground size-4" />
        <p>Settings</p>
      </Link>
      <div className="mt-4 pl-1">
        <div className="flex items-center space-x-2">
          <Building2Icon className="text-muted-foreground size-5" />
          <span className="text-muted-foreground text-sm font-semibold">
            Team
          </span>
        </div>
        <ul className="mt-3 space-y-1">
          <Link to={`/${teamSlug}/settings/general`}>
            <li
              className={`cursor-default rounded-sm py-1 pl-6 text-sm ${location.pathname.includes("/general") ? "bg-accent hover:bg-none" : "hover:bg-base-200"}`}
            >
              General
            </li>
          </Link>
          <Link to={`/${teamSlug}/settings/members`}>
            <li
              className={`cursor-default rounded-sm py-1 pl-6 text-sm ${location.pathname.includes("/members") ? "bg-accent hover:bg-none" : "hover:bg-base-200"}`}
            >
              Members
            </li>
          </Link>
          {role === "owner" ? (
            <Link to={`/${teamSlug}/settings/billing`}>
              <li
                className={`cursor-default rounded-sm py-1 pl-6 text-sm ${location.pathname.includes("/billing") ? "bg-accent hover:bg-none" : "hover:bg-base-200"}`}
              >
                Billing
              </li>
            </Link>
          ) : null}
        </ul>
      </div>
      <div className="mt-6 pl-1">
        <div className="flex items-center space-x-2">
          <CircleUser className="text-muted-foreground size-5" />
          <span className="text-muted-foreground text-sm font-semibold">
            Account
          </span>
        </div>
        <ul className="mt-3 space-y-2">
          <Link to={`/${teamSlug}/settings/account/profile`}>
            <li
              className={`cursor-default rounded-sm py-1 pl-6 text-sm ${location.pathname.includes("/profile") ? "bg-accent hover:bg-none" : "hover:bg-base-200"}`}
            >
              Profile
            </li>
          </Link>
          <Link to={`/${teamSlug}/settings/account/preferences`} className="mt">
            <li
              className={`cursor-default rounded-sm py-1 pl-6 text-sm ${location.pathname.includes("/preferences") ? "bg-accent hover:bg-none" : "hover:bg-base-200"}`}
            >
              Preferences
            </li>
          </Link>
          <Link to={`/${teamSlug}/settings/account/security`} className="mt">
            <li
              className={`cursor-default rounded-sm py-1 pl-6 text-sm ${location.pathname.includes("/security") ? "bg-accent hover:bg-none" : "hover:bg-base-200"}`}
            >
              Security
            </li>
          </Link>
        </ul>
      </div>
    </div>
  );
}

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <CoreApplicationShell
        sideNavConent={<SettingsSideNavContent role={loaderData.role} />}
        mainContent={<Outlet />}
      />
    </div>
  );
}
