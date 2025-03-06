import { type Route } from "./+types/root.js";
import { captureRemixErrorBoundaryError } from "@sentry/remix";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useFetchers,
  useLoaderData,
  useRouteError,
  type LinksFunction,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "react-router";
import uiGlobalStylesheet from "@www/ui/globals.css?url";
import sonnerStyles from "~/styles/sonner.css?url";
import { toast, Toaster } from "sonner";
import { RootErrorBoundary } from "./components/error-boundary/index.js";
import { type ActionErrorResponse, isActionError } from "./utils/response.js";
import { useEffect, useRef } from "react";
import { customers, users } from "@acme/database/schema";
import { useRootTheme } from "./hooks/theme.js";
import {
  CircleAlert,
  CircleCheckBig,
  CircleXIcon,
  InfoIcon,
} from "lucide-react";
import {
  getCustomerOrThrow,
  getUserFromSessionOrThrow,
} from "./utils/auth/core.server.js";
import { SessionRepository } from "./repositories/sessions.server.js";
import { UserRepository } from "./repositories/users.server.js";
import { CustomerRepository } from "./repositories/customers.server.js";
import { clientConfig_SERVER_RUNTIME_ONLY } from "./public-config.js";
import {
  GoogleAnalyticsScripts,
  KlaviyoAnalyticsScripts,
} from "./components/analytics-tracking.js";
import { identifyKlaviyoUser } from "./utils/analytics/klaviyo/klaviyo.js";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: uiGlobalStylesheet },
  { rel: "stylesheet", href: sonnerStyles },
  {
    rel: "icon",
    href: "/favicon.ico",
    type: "image/x-icon",
  },
];

export const meta: MetaFunction = () => [
  {
    charset: "utf-8",
    title: "Acme",
    viewport: "width=device-width,initial-scale=1",
  },
];

export const DEFAULT_THEME = "light";

export const loader = async (args: LoaderFunctionArgs) => {
  try {
    const user = await getUserFromSessionOrThrow({
      sessionRepo: new SessionRepository(),
      cookieHeader: args.request.headers.get("Cookie"),
      userRepo: new UserRepository(),
      projection: { id: users.id, email: users.email, name: users.name },
      thrower: () => {
        throw new Error();
      },
    });

    const customer = await getCustomerOrThrow({
      userId: user.id,
      projection: { activeTheme: customers.activeTheme },
      customerRepo: new CustomerRepository(),
      thrower: () => {
        throw new Error();
      },
    });

    const nameParts = user.name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts[1];

    return {
      activeTheme: customer.activeTheme ?? DEFAULT_THEME,
      config: clientConfig_SERVER_RUNTIME_ONLY,
      userInfo: { email: user.email, id: user.id, firstName, lastName },
    };
  } catch (e) {
    // If this throws, it's because the user isn't signed in.
    return {
      activeTheme: DEFAULT_THEME,
      config: clientConfig_SERVER_RUNTIME_ONLY,
      userInfo: null,
    };
  }
};

function useRootFetchersActionErrorToast() {
  const actionErrors = useFetchers()
    .filter((fetcher) => {
      return isActionError(fetcher.data);
    })
    .map((fetcher) => fetcher.data.error as ActionErrorResponse["error"]);

  const displayedErrors = useRef<Set<number>>(new Set());

  useEffect(() => {
    actionErrors.forEach((error) => {
      displayedErrors.current.has(error.timestamp);
      if (!displayedErrors.current.has(error.timestamp)) {
        toast.error(error.message);
        displayedErrors.current.add(error.timestamp);
      }
    });
  }, [actionErrors]);
}

export function Layout({ children }: { children: React.ReactNode }) {
  useRootFetchersActionErrorToast();
  const theme = useRootTheme();
  const loaderData = useLoaderData();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <GoogleAnalyticsScripts />
        <KlaviyoAnalyticsScripts />
      </head>
      <body className={theme}>
        {children}
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.config= ${JSON.stringify(loaderData.config)}`,
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}

function App({ loaderData }: Route.ComponentProps) {
  useEffect(() => {
    if (loaderData.userInfo) {
      identifyKlaviyoUser(loaderData.userInfo.email, {
        $id: loaderData.userInfo.id,
        $first_name: loaderData.userInfo.firstName,
        $last_name: loaderData.userInfo.lastName,
      });
    }
  }, [loaderData]);

  return (
    <>
      <Toaster
        toastOptions={{
          classNames: {
            toast: "bg-base-200 border-border space-x-2",
            title: "text-foreground",
            description: "text-foreground-muted",
            actionButton: "bg-primary",
            cancelButton: "bg-accent",
            closeButton: "bg-accent",
          },
        }}
        icons={{
          success: <CircleCheckBig className="text-success" />,
          info: <InfoIcon className="text-info" />,
          warning: <CircleAlert className="text-warning" />,
          error: <CircleXIcon className="text-destructive" />,
        }}
      />
      <Outlet />
    </>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  captureRemixErrorBoundaryError(error);
  return (
    <div className="h-screen">
      <RootErrorBoundary />
    </div>
  );
}

export default App;
