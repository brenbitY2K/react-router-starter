import { users } from "@acme/database/schema";
import { Button } from "@www/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@www/ui/dropdown-menu";
import { Form, Link, Outlet, useLoaderData, useNavigate } from "react-router";
import { data, type LoaderFunctionArgs } from "react-router";
import { ArrowLeftToLine } from "lucide-react";
import { getAllSessionsAndInvalidateStaleOnes } from "~/utils/auth/core.server.js";
import { requireUserFromSession } from "~/utils/auth/loaders.server.js";
import { createLoaderLogger } from "~/utils/loaders.server.js";
import { FormLayoutIntent } from "../../routes/api/form/intents.js";
import { SessionRepository } from "~/repositories/sessions.server.js";
import { UserQuerier } from "~/repositories/users.server.js";

export const loader = async (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);

  const user = await requireUserFromSession({
    args,
    logger,
    projection: { id: users.id, email: users.email },
  });

  const { users: allActiveUserSessions, setCookieHeaders } =
    await getAllSessionsAndInvalidateStaleOnes({
      sessionRepo: new SessionRepository(),
      cookieHeader: args.request.headers.get("Cookie"),
      userQuerier: new UserQuerier(),
    });

  return data(
    { allActiveUserSessions, currentUser: user },
    { headers: [...setCookieHeaders] },
  );
};

export default function SessionPickerHeader() {
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex min-h-screen w-full flex-col justify-between">
        {loaderData.allActiveUserSessions.length > 1 && (
          <div className="flex w-full items-center justify-between px-10 py-2">
            <Button variant="ghost">
              <ArrowLeftToLine
                className="size-6"
                onClick={() => navigate(-1)}
              />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <button className="ring-offset-base-100 focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground relative inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                  <span className="flex flex-col items-start p-4">
                    <p className="text-muted-foreground text-sm">
                      Logged in as:
                    </p>
                    <p className="text-foreground text-sm">
                      {loaderData.currentUser.email}
                    </p>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {loaderData.allActiveUserSessions.map((user) => (
                  <Form key={user.id} method="POST" action="/form" replace>
                    <input
                      type="hidden"
                      name="intent"
                      value={FormLayoutIntent.CHANGE_SESSION}
                    />
                    <input type="hidden" name="userId" value={user.id} />
                    <DropdownMenuCheckboxItem
                      key={user.id}
                      checked={user.id === loaderData.currentUser.id}
                      onClick={(e) => e.currentTarget.closest("form")?.submit()}
                    >
                      {user.email}
                    </DropdownMenuCheckboxItem>
                  </Form>
                ))}
                <Link to="/add-account">
                  <DropdownMenuItem>Add an account</DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        <Outlet />
      </div>
    </div>
  );
}
