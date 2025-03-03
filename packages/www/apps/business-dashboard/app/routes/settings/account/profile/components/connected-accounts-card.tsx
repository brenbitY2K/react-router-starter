import type { Info } from "../+types/profile-route";
import { Button } from "@www/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@www/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@www/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@www/ui/dropdown-menu";
import { SiGoogle } from "@icons-pack/react-simple-icons";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { Form, Link, useFetcher, useSubmit } from "react-router";
import { SettingsAccountProfileRouteIntent } from "../profile-route.js";
import { useState } from "react";
import { type disconnectConnectedAccount } from "../actions/disonnect-connected-account.js";

export function ConnectedAccountsCard({
  connectedAccounts,
}: Pick<Info["loaderData"], "connectedAccounts">) {
  let googleAccount = connectedAccounts.google;

  const disonnectConnectAccountFetcher = useFetcher<
    typeof disconnectConnectedAccount
  >({
    key: SettingsAccountProfileRouteIntent.DISCONNECT_CONNECTED_ACCOUNT,
  });

  if (disonnectConnectAccountFetcher.formData?.get("providerId") === "google") {
    googleAccount = undefined;
  }

  return (
    <Card className="bg-base-200">
      <CardHeader className="bg-base-300 rounded-sm px-4 py-2">
        <CardTitle className="text-muted-foreground text-sm">
          Connected accounts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {googleAccount ? (
          <ActiveGoogleListItem email={googleAccount.email} />
        ) : (
          <InactiveGoogleListItem />
        )}
      </CardContent>
    </Card>
  );
}

function InactiveGoogleListItem() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="bg-base-300 flex size-10 items-center justify-center rounded-md">
          <SiGoogle className="size-3" />
        </div>
        <div>
          <p className="font-semibold">Google</p>
          <p className="text-muted-foreground text-sm">
            Login with your google account
          </p>
        </div>
      </div>
      <Link
        to="/login/google"
        className="text-primary flex items-center text-xs"
      >
        Connect <ChevronRightIcon className="size-4" />
      </Link>
    </div>
  );
}

function ActiveGoogleListItem({ email }: { email: string }) {
  const [openDisconnectDialog, setOpenDisconnectDialog] = useState(false);
  const submit = useSubmit();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="bg-base-300 flex size-10 items-center justify-center rounded-md">
          <SiGoogle className="size-3" />
        </div>
        <div>
          <p className="font-semibold">Google</p>
          <p className="text-muted-foreground text-sm">
            You can login to Acme using your Google account
          </p>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="ml-2">
            <span className="flex cursor-pointer items-center space-x-2">
              <div className="bg-success size-2 rounded-full" />
              <p className="text-xs">{email}</p>
              <ChevronDownIcon className="text-foreground size-3" />
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setOpenDisconnectDialog(true)}>
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog
        open={openDisconnectDialog}
        onOpenChange={(open) => setOpenDisconnectDialog(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Google account?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Form
              method="POST"
              onSubmit={(e) => {
                e.preventDefault();
                submit(e.currentTarget, { navigate: false });
              }}
            >
              <input type="hidden" name="providerId" value="google" />
              <input
                type="hidden"
                name="intent"
                value={
                  SettingsAccountProfileRouteIntent.DISCONNECT_CONNECTED_ACCOUNT
                }
              />
              <Button variant="destructive" type="submit">
                Disconnect
              </Button>
            </Form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
