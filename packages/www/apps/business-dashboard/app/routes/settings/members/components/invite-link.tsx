import { Button } from "@www/ui/button";
import { Switch } from "@www/ui/switch";
import { Input } from "@www/ui/input";
import { CopyIcon, RefreshCwIcon } from "lucide-react";
import { useFetcher, useLoaderData } from "react-router";
import { toast } from "sonner";
import { SettingsMemberRouteIntent, type loader } from "../members-route.js";

export function InviteLink() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const inviteLink = loaderData.inviteLink;
  const inviteLinkEnabled = inviteLink !== null;

  const currentAction = fetcher.formData
    ? fetcher.formData.get("intent")
    : null;

  const toggleEnabled = fetcher.formData
    ? currentAction === SettingsMemberRouteIntent.TOGGLE_INVITE_LINK
      ? fetcher.formData.get("inviteLinkToggle") === "on"
      : inviteLinkEnabled
    : inviteLinkEnabled;

  const copyToClipboard = () => {
    toast.success("Invite link copied to clipboard.");
    navigator.clipboard.writeText(inviteLink ?? "");
  };

  return (
    <div className="space-y-2">
      <fetcher.Form
        className="flex w-full items-center justify-between"
        method="POST"
      >
        <input
          type="hidden"
          name="intent"
          value={SettingsMemberRouteIntent.TOGGLE_INVITE_LINK}
        />
        <input
          type="hidden"
          name="inviteLinkToggle"
          value={inviteLinkEnabled ? "off" : "on"}
        />
        <h3 className="text-md font-semibold">Invite link</h3>
        <Switch type="submit" checked={toggleEnabled} />
      </fetcher.Form>
      <p className="text-muted-foreground">
        {toggleEnabled
          ? "Share this link with others you'd like to join your team."
          : "Invite links provide a unique URL that allows anyone to join your team"}
      </p>
      {toggleEnabled && (
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            value={inviteLink ?? ""}
            className="flex-1"
            readOnly
          />
          <fetcher.Form method="POST">
            <Button
              variant="outline"
              className="p-2"
              type="submit"
              name="intent"
              value={SettingsMemberRouteIntent.REFRESH_INVITE_LINK}
              loading={
                currentAction === SettingsMemberRouteIntent.REFRESH_INVITE_LINK
              }
            >
              <RefreshCwIcon className="h-5 w-5" />
            </Button>
          </fetcher.Form>
          <Button className="ml-2" onClick={copyToClipboard}>
            <CopyIcon className="mr-2 h-5 w-5" />
            Copy
          </Button>
        </div>
      )}
    </div>
  );
}
