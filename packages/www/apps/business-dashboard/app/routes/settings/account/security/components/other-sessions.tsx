import { createElement, useState } from "react";
import { useFetchers, useLoaderData, useSubmit } from "react-router";
import { Button } from "@www/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@www/ui/dialog";
import { getBrowserIcon } from "../utils.js";
import { AccountSecurityRouteIntent, type loader } from "../security-route.js";
import { type LoaderData } from "~/utils/loaders.js";

type SessionType = LoaderData<typeof loader>["otherSessions"][number];

export function OtherSessions() {
  const loaderData = useLoaderData<typeof loader>();
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [isRevokeAllDialogOpen, setIsRevokeAllDialogOpen] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<SessionType | null>(
    null,
  );

  let sessions = loaderData.otherSessions;
  const submit = useSubmit();

  const fetchers = useFetchers().filter(
    (fetcher) =>
      fetcher.formData &&
      (fetcher.formData.get("intent") ===
        AccountSecurityRouteIntent.REVOKE_ALL_SESSIONS ||
        fetcher.formData.get("intent") ===
        AccountSecurityRouteIntent.REVOKE_SPECIFIC_SESSION),
  );

  fetchers.forEach((fetcher) => {
    if (fetcher.formData) {
      const intent = fetcher.formData.get(
        "intent",
      ) as AccountSecurityRouteIntent;
      if (intent === AccountSecurityRouteIntent.REVOKE_ALL_SESSIONS) {
        sessions = [];
      } else if (
        intent === AccountSecurityRouteIntent.REVOKE_SPECIFIC_SESSION
      ) {
        const sessionId = fetcher.formData.get("sessionId") as string;
        sessions = sessions.filter((session) => session.id !== sessionId);
      }
    }
  });

  const initialSessionsToShow = 5;
  const hasMoreSessions = sessions.length > initialSessionsToShow;

  const visibleSessions = showAllSessions
    ? sessions
    : sessions.slice(0, initialSessionsToShow);

  const handleRevokeClick = (session: SessionType) => {
    setSessionToRevoke(session);
    setIsRevokeDialogOpen(true);
  };

  const handleRevokeConfirm = () => {
    if (sessionToRevoke) {
      submit(
        {
          intent: AccountSecurityRouteIntent.REVOKE_SPECIFIC_SESSION,
          sessionId: sessionToRevoke.id,
        },
        { method: "post", navigate: false },
      );
    }
    setIsRevokeDialogOpen(false);
    setSessionToRevoke(null);
  };

  const handleRevokeAllClick = () => {
    setIsRevokeAllDialogOpen(true);
  };

  const handleRevokeAllConfirm = () => {
    submit(
      { intent: AccountSecurityRouteIntent.REVOKE_ALL_SESSIONS },
      { method: "post", navigate: false },
    );
    setIsRevokeAllDialogOpen(false);
  };

  if (sessions.length === 0) return <div />;

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {sessions.length} other sessions
          </h3>
          <Button variant="ghost" size="sm" onClick={handleRevokeAllClick}>
            Revoke all
          </Button>
        </div>
        <div className="space-y-2">
          {visibleSessions.map((session, index) => (
            <div
              key={index}
              className="bg-base-200 group flex items-center justify-between rounded-md border p-4"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-base-300 flex size-8 items-center justify-center rounded-lg">
                  <span className="text-muted-foreground">
                    {createElement(getBrowserIcon(session.browser), {
                      className: "size-4",
                    })}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{session.deviceText}</p>
                  <p className="text-muted-foreground text-sm">
                    {session.locationText} · Last seen {session.lastSeenText}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="invisible group-hover:visible"
                onClick={() => handleRevokeClick(session)}
              >
                Revoke access
              </Button>
            </div>
          ))}
        </div>
        {hasMoreSessions && !showAllSessions && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setShowAllSessions(true)}
          >
            Show all
          </Button>
        )}
      </div>

      <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke access</DialogTitle>
            <DialogDescription>
              Revoke access to "{sessionToRevoke?.deviceText}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRevokeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevokeConfirm}>
              Revoke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isRevokeAllDialogOpen}
        onOpenChange={setIsRevokeAllDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke All Sessions</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke access for all other sessions?
              This action will log out all devices except for your current
              session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRevokeAllDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevokeAllConfirm}>
              Revoke All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
