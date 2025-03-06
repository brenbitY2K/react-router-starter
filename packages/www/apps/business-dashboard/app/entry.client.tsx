import * as Sentry from "@sentry/remix";
import { useLocation, useMatches } from "react-router";
import { HydratedRouter } from "react-router/dom";
import { startTransition, StrictMode, useEffect } from "react";
import { hydrateRoot } from "react-dom/client";

Sentry.init({
  dsn: "https://5a0b0bd6caeb2dfe6709a8c34816c66a@o4507404237209600.ingest.us.sentry.io/4507404247564288",
  tracesSampleRate: 1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,

  integrations: [
    Sentry.browserTracingIntegration({
      useEffect,
      useLocation,
      useMatches,
    }),
    Sentry.replayIntegration(),
  ],
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});
