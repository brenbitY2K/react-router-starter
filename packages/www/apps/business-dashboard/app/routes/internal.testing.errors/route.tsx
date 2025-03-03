import { Button } from "@www/ui/button";
import { Form, useActionData, useSearchParams } from "react-router";
import { type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import {
  LocalErrorBoundary,
  getErrorResponseMessageFromData,
} from "~/components/error-boundary/index.js";
import { useActionErrorToast } from "~/hooks/action.js";
import { type Logger } from "~/logging/index.js";
import {
  actionWithDefaultErrorHandling,
  getActionIntent,
} from "~/utils/actions.server.js";
import { createLoaderLogger } from "~/utils/loaders.server.js";
import {
  isNotFoundErrorResponse,
  isUnauthenticatedErrorResponse,
  isUnauthorizedErrorResponse,
  type ErrorResponseType,
} from "~/utils/response.js";
import {
  throwActionErrorAndLog,
  throwErrorResponseJsonAndLog,
  throwNotFoundErrorResponseJsonAndLog,
  throwUnauthenticatedErrorResponseJsonAndLog,
  throwUnauthorizedErrorResponseJsonAndLog,
} from "~/utils/response.server.js";

export const loader = (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);

  const url = new URL(args.request.url);
  const searchParams = url.searchParams;

  const type = searchParams.get("type") as
    | ErrorResponseType
    | number
    | "unknown"
    | "404";

  const boundaryConfig = searchParams.get("boundary");
  const location = boundaryConfig === "root" ? "root" : "local";

  // eslint-disable-next-line
  switch (type) {
    case "not_found": {
      throw throwNotFoundErrorResponseJsonAndLog({
        data: { message: "not_found error response" },
        location,
        logInfo: {
          logger,
          event: "test",
        },
      });
    }
    case "unauthenticated": {
      throw throwUnauthenticatedErrorResponseJsonAndLog({
        data: { message: "unauthenticated error response" },
        location,
        logInfo: {
          logger,
          event: "test",
        },
      });
    }
    case "unauthorized": {
      throw throwUnauthorizedErrorResponseJsonAndLog({
        data: { message: "unauthorized error response" },
        location,
        logInfo: {
          logger,
          event: "test",
        },
      });
    }
    case "404": {
      throw throwErrorResponseJsonAndLog({
        data: { message: "404 error response" },
        init: { status: 404 },
        location,
        logInfo: {
          logger,
          event: "test",
        },
      });
    }
    case "unknown": {
      throw Error("Actual error thrown");
    }
  }

  return null;
};

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    const intent = await getActionIntent(args.request);

    if (intent === "known")
      throw throwActionErrorAndLog({
        message: "This is a known action error",
        logInfo: { logger, event: "test" },
      });
    if (intent === "unknown") throw new Error("This is a random error");
  },
);

const updateSearchParams = (
  searchParams: URLSearchParams,
  key: string,
  value: string,
): URLSearchParams => {
  const newSearchParams = new URLSearchParams(searchParams);

  if (key === "type") {
    newSearchParams.set("type", value);
  } else if (key === "boundary") {
    newSearchParams.set("boundary", value);
  }

  return newSearchParams;
};

export default function ErrorTesting() {
  const [searchParams, setSearchParams] = useSearchParams();
  const actionData = useActionData();

  function handleClick(key: string, value: string) {
    const newSearchParams = updateSearchParams(searchParams, key, value);
    setSearchParams(newSearchParams, {
      preventScrollReset: true,
    });
  }

  useActionErrorToast(actionData);
  return (
    <div>
      <h1 className="text-2xl">
        This page is to test our error handling logic
      </h1>
      <Form method="POST">
        <h2 className="text-lg">Action errors</h2>
        <div className="flex flex-col space-y-4">
          <Button name="_action" value="known">
            Known action error
          </Button>
          <Button name="_action" value="unknown">
            Unknown error
          </Button>
        </div>
      </Form>
      <Form>
        <h2 className="text-lg">Loader errors</h2>
        <div className="flex flex-col space-y-4">
          <Button
            type="button"
            onClick={() => handleClick("type", "not_found")}
          >
            not_found
          </Button>
          <Button
            type="button"
            onClick={() => handleClick("type", "unauthorized")}
          >
            unauthorized
          </Button>
          <Button
            type="button"
            onClick={() => handleClick("type", "unauthenticated")}
          >
            unauthenticated
          </Button>
          <Button type="button" onClick={() => handleClick("type", "404")}>
            404
          </Button>

          <Button type="button" onClick={() => handleClick("type", "unknown")}>
            unknown error type
          </Button>
          <Button
            type="button"
            onClick={() => handleClick("boundary", "root")}
            variant="secondary"
          >
            root boundary
          </Button>
          <Button
            type="button"
            onClick={() => handleClick("boundary", "local")}
            variant="secondary"
          >
            local boundary
          </Button>
          <Button
            type="button"
            onClick={() => handleClick("boundary", "local-default")}
            variant="secondary"
          >
            local (default) boundary
          </Button>
        </div>
      </Form>
    </div>
  );
}

export function ErrorBoundary() {
  const [searchParams] = useSearchParams();
  const boundaryConfig = searchParams.get("boundary");

  if (boundaryConfig === "local-default") {
    return (
      <div>
        <h1>Local Error Boundary (with just defaults)</h1>
        <LocalErrorBoundary />
      </div>
    );
  }

  // Note: boundaryConfig can also = 'root' but this will
  // be handled the loader by passing location="root" to
  // the throwers.
  return (
    <div>
      <h1>Local Error Boundary</h1>
      <LocalErrorBoundary
        statusHandlers={{
          404: ({ error }) => {
            if (isNotFoundErrorResponse(error)) {
              return (
                <p>We know this is a not_found error: {error.data.message}</p>
              );
            }
            return (
              <p>
                We don't know what caused this one, but we do know it's a 404:{" "}
                {getErrorResponseMessageFromData(error)}
              </p>
            );
          },
          401: ({ error }) => {
            if (isUnauthenticatedErrorResponse(error)) {
              return (
                <p>
                  We know this is a unauthenticated error: {error.data.message}
                </p>
              );
            }
            return (
              <p>
                We don't know what caused this one, but we do know it's a 401:{" "}
                {getErrorResponseMessageFromData(error)}
              </p>
            );
          },
          403: ({ error }) => {
            if (isUnauthorizedErrorResponse(error)) {
              return (
                <p>
                  We know this is a unauthorized error: {error.data.message}
                </p>
              );
            }
            return (
              <p>
                We don't know what caused this one, but we know it's a 403:{" "}
                {getErrorResponseMessageFromData(error)}
              </p>
            );
          },
        }}
      />
    </div>
  );
}
