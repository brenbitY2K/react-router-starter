import { createElement } from "react";
import { Link, useLoaderData } from "react-router";
import { Button } from "@www/ui/button";
import { getBrowserIcon } from "../utils.js";
import { type loader } from "../security-route.js";

export function CurrentSession() {
  const { currentSession: session } = useLoaderData<typeof loader>();
  return (
    <div className="bg-base-200 group rounded-md border p-4">
      <div className="flex items-center justify-between">
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
              <span className="text-success">• Current session</span> ·
              {" " + session.locationText}
            </p>
          </div>
        </div>
        <Link to="/logout">
          <Button
            variant="ghost"
            size="sm"
            className="invisible group-hover:visible"
          >
            Logout
          </Button>
        </Link>
      </div>
    </div>
  );
}
