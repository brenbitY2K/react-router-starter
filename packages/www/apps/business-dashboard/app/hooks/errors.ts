import { useRouteError } from "react-router";
import { isRootRouteErrorResponse } from "~/utils/response.js";

// Throws root errors (e.g. auth related) for use
// in the root level ErrorBoundary
export function useLocalRouteError() {
  const error = useRouteError();

  if (isRootRouteErrorResponse(error)) throw error;

  return error;
}
