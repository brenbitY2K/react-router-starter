import {
  type ErrorResponse,
  isRouteErrorResponse,
  useAsyncError,
  useParams,
  useRouteError,
} from "react-router";
import { useLocalRouteError } from "~/hooks/errors.js";
import { captureRemixErrorBoundaryError } from "@sentry/remix";
import {
  isNotFoundErrorResponse,
  isUnauthenticatedErrorResponse,
  isUnauthorizedErrorResponse,
} from "~/utils/response.js";
import { RootUnauthorizedPage } from "./unauthorized.js";
import { RootUnauthenticatedPage } from "./unauthenticated.js";

function getErrorMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  console.error("Unable to get error message for error", error);
  return "Unknown Error";
}

export function getErrorResponseMessageFromData(error: ErrorResponse) {
  if (typeof error.data === "string") return error.data;

  if ("message" in error.data && typeof error.data.message === "string") {
    return error.data.message;
  }

  console.error("Unable to get error message for error", error);
  return "Unknown Error";
}

type StatusHandler = (info: {
  error: ErrorResponse;
  params: Record<string, string | undefined>;
}) => JSX.Element | null;

export function RootErrorBoundary() {
  const error = useRouteError();
  return (
    <BaseErrorBoundary
      defaultStatusHandler={({ error }) => (
        <div className="flex flex-col items-center justify-center space-y-4">
          <p>Status code: {error.status}</p>
          <p>{getErrorResponseMessageFromData(error)}</p>
        </div>
      )}
      unexpectedErrorHandler={(error) => (
        <p className="text-white">{getErrorMessage(error)}</p>
      )}
      error={error}
    />
  );
}

export function LocalErrorBoundary({
  defaultStatusHandler = ({ error }) => (
    <div className="flex flex-col items-center justify-center space-y-4">
      <p>Status code: {error.status}</p>
      <p>{getErrorResponseMessageFromData(error)}</p>
    </div>
  ),
  statusHandlers,
  unexpectedErrorHandler = (error) => <p>{getErrorMessage(error)}</p>,
}: {
  defaultStatusHandler?: StatusHandler;
  statusHandlers?: Record<number, StatusHandler>;
  unexpectedErrorHandler?: (error: unknown) => JSX.Element | null;
}) {
  const error = useLocalRouteError();
  return (
    <BaseErrorBoundary
      defaultStatusHandler={defaultStatusHandler}
      statusHandlers={statusHandlers}
      unexpectedErrorHandler={unexpectedErrorHandler}
      error={error}
    />
  );
}

export function LocalAsyncErrorBoundary({
  defaultStatusHandler = ({ error }) => (
    <div className="flex flex-col items-center justify-center space-y-4">
      <p>Status code: {error.status}</p>
      <p>{getErrorResponseMessageFromData(error)}</p>
    </div>
  ),
  statusHandlers,
  unexpectedErrorHandler = (error) => <p>{getErrorMessage(error)}</p>,
}: {
  defaultStatusHandler?: StatusHandler;
  statusHandlers?: Record<number, StatusHandler>;
  unexpectedErrorHandler?: (error: unknown) => JSX.Element | null;
}) {
  const error = useAsyncError();
  return (
    <BaseErrorBoundary
      defaultStatusHandler={defaultStatusHandler}
      statusHandlers={statusHandlers}
      unexpectedErrorHandler={unexpectedErrorHandler}
      error={error}
    />
  );
}

/* If the type guard and regular output look the same, it's because
 * that type of error doesn't have anything valuable to display except
 * the message field. The goal here is to plan for the future when
 * we might want to have specific data attached to certain errors.
 */
const predictableDefaultStatusHandlers: Record<number, StatusHandler> = {
  404: ({ error }) => {
    if (isNotFoundErrorResponse(error)) {
      return <p>{error.data.message}</p>;
    }
    return <p>{getErrorResponseMessageFromData(error)}</p>;
  },
  401: ({ error }) => {
    if (isUnauthenticatedErrorResponse(error)) {
      return <RootUnauthenticatedPage message={error.data.message} />;
    }
    return <p>{getErrorResponseMessageFromData(error)}</p>;
  },
  403: ({ error }) => {
    if (isUnauthorizedErrorResponse(error)) {
      return <RootUnauthorizedPage message={error.data.message} />;
    }
    return <p>{getErrorResponseMessageFromData(error)}</p>;
  },
};

function BaseErrorBoundary({
  defaultStatusHandler = ({ error }) => (
    <div className="flex flex-col items-center justify-center space-y-4">
      <p>Status code: {error.status}</p>
      <p>{getErrorResponseMessageFromData(error)}</p>
    </div>
  ),
  statusHandlers,
  unexpectedErrorHandler = (error) => <p>{getErrorMessage(error)}</p>,
  error,
}: {
  defaultStatusHandler?: StatusHandler;
  statusHandlers?: Record<number, StatusHandler>;
  unexpectedErrorHandler?: (error: unknown) => JSX.Element | null;
  error: unknown;
}) {
  captureRemixErrorBoundaryError(error);
  const params = useParams();

  if (typeof document !== "undefined") {
    console.error(error);
  }

  let statusHandlersWithPredictableDefaults = predictableDefaultStatusHandlers;

  if (statusHandlers !== undefined) {
    statusHandlersWithPredictableDefaults = {
      ...statusHandlersWithPredictableDefaults,
      ...statusHandlers,
    };
  }

  return (
    <div className="container flex h-full w-full items-center justify-center p-20">
      {isRouteErrorResponse(error)
        ? (
            statusHandlersWithPredictableDefaults?.[error.status] ??
            defaultStatusHandler
          )({
            error,
            params,
          })
        : unexpectedErrorHandler(error)}
    </div>
  );
}
