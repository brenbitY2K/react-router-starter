import { Button } from "@www/ui/button";
import { Card, CardContent } from "@www/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@www/ui/dialog";
import { Input } from "@www/ui/input";
import { Label } from "@www/ui/label";
import { Separator } from "@www/ui/separator";
import {
  type loader,
  SettingsAccountProfileRouteIntent,
} from "../profile-route.js";
import { isFormValidationActionError } from "~/utils/response.js";
import { ErrorList } from "~/components/forms.js";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type checkForExistingEmail } from "../actions/check-for-existing-email.js";
import { useFetcherWithReset } from "~/hooks/action.js";
import { useLoaderData } from "react-router";
import { type cancelOngoingEmailChange } from "../actions/cancel-ongoing-email-change.js";
import { type updateCoreProfileInfo } from "../actions/update-core-profile-info.js";
import { ProfilePicture } from "./profile-picture.js";

export function ProfileCard() {
  const loaderData = useLoaderData<typeof loader>();

  const [name, setName] = useState(loaderData.name);

  const [isActionDataFresh, setIsActionDataFresh] = useState(false);

  const updateCoreProfileInfoFetcher = useFetcherWithReset<
    typeof updateCoreProfileInfo
  >({
    key: SettingsAccountProfileRouteIntent.UPDATE_CORE_PROFILE_INFO,
  });

  useEffect(() => {
    if (updateCoreProfileInfoFetcher.state === "submitting")
      setIsActionDataFresh(true);
  }, [updateCoreProfileInfoFetcher.state]);

  useEffect(() => {
    if (isActionDataFresh) {
      if (
        updateCoreProfileInfoFetcher.data &&
        "success" in updateCoreProfileInfoFetcher.data &&
        updateCoreProfileInfoFetcher.data.success
      ) {
        setIsActionDataFresh(false);
        toast.success("Your profile information has been updated.");
      }
    }
  }, [updateCoreProfileInfoFetcher.data, isActionDataFresh]);

  function submitCoreInfo() {
    const formData = new FormData();
    formData.set("name", name);
    formData.set(
      "intent",
      SettingsAccountProfileRouteIntent.UPDATE_CORE_PROFILE_INFO,
    );
    updateCoreProfileInfoFetcher.submit(formData, { method: "POST" });
  }

  return (
    <Card className="bg-base-300">
      <CardContent className="p-0">
        <ProfilePicture />
        <div className="bg-base-200 space-y-4 rounded-md p-4">
          <div className="flex items-center justify-between">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <EmailInputButtonAndDialog />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="full-name">Full name</Label>
            <div>
              <Input
                className="w-[200px]"
                type="text"
                id="full-name"
                value={name}
                onBlur={submitCoreInfo}
                onChange={(e) => setName(e.target.value)}
              />
              {isFormValidationActionError(updateCoreProfileInfoFetcher.data) &&
                updateCoreProfileInfoFetcher.data.formValidationError.name
                  ?._errors && (
                  <ErrorList
                    errors={
                      updateCoreProfileInfoFetcher.data.formValidationError.name
                        ._errors
                    }
                  />
                )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmailInputButtonAndDialog() {
  const loaderData = useLoaderData<typeof loader>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogState, setDialogState] = useState<
    "check-email" | "email-taken" | "change-in-progress"
  >(
    loaderData.emailChangeRequestAlreadyExists
      ? "change-in-progress"
      : "check-email",
  );

  function handleEmailChangeRequestSuccess() {
    setDialogOpen(false);
    setDialogState("change-in-progress");
  }

  function handleEmailAlreadyExists() {
    setDialogState("email-taken");
  }

  function handleCancelOngoingEmailChangeSuccess() {
    setDialogState("check-email");
    setDialogOpen(false);
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open && dialogState === "email-taken") setDialogState("check-email");
  }

  return (
    <Dialog onOpenChange={handleDialogOpenChange} open={dialogOpen}>
      <DialogTrigger asChild>
        <button className="border-input bg-base-200 ring-offset-base-100 placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-[200px] cursor-text overflow-hidden rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
          <span>{loaderData.email}</span>
        </button>
      </DialogTrigger>
      {dialogState === "email-taken" ? (
        <EmailTakenDialogContent />
      ) : dialogState === "change-in-progress" ? (
        <EmailChangeAlreadyInProgressDialogContent
          onSuccess={handleCancelOngoingEmailChangeSuccess}
        />
      ) : (
        <CheckEmailDialogContent
          onSuccess={handleEmailChangeRequestSuccess}
          onEmailAlreadyExists={handleEmailAlreadyExists}
        />
      )}
    </Dialog>
  );
}

function CheckEmailDialogContent({
  onSuccess,
  onEmailAlreadyExists,
}: {
  onSuccess: () => void;
  onEmailAlreadyExists: () => void;
}) {
  const [isActionDataFresh, setIsActionDataFresh] = useState(false);

  const fetcher = useFetcherWithReset<typeof checkForExistingEmail>({
    key: SettingsAccountProfileRouteIntent.CHECK_FOR_EXISTING_EMAIL,
  });

  useEffect(() => {
    if (fetcher.state === "submitting") setIsActionDataFresh(true);
  }, [fetcher.state]);

  useEffect(() => {
    if (fetcher.data && "emailTaken" in fetcher.data && isActionDataFresh) {
      setIsActionDataFresh(false);
      if (!fetcher.data.emailTaken) {
        toast.success(
          `We have sent a verificaiton link to ${fetcher.data.email}. We will update your email address once you click this link.`,
        );
        onSuccess();
      } else {
        onEmailAlreadyExists();
      }
    }
  }, [fetcher.data, isActionDataFresh, onEmailAlreadyExists, onSuccess]);

  const loading = fetcher.state !== "idle";

  return (
    <DialogContent>
      <DialogHeader>Change email</DialogHeader>
      <DialogDescription>
        If you'd like to change the email address for your account, we'll send a
        verification link to your email address
      </DialogDescription>
      <DialogDescription>
        Before we do that, we need to check if the new email address is
        connected to an account already.
      </DialogDescription>
      <fetcher.Form method="POST">
        <Label htmlFor="email" className="mt-6">
          Enter the new email address you'd like to use
        </Label>
        <Input
          disabled={loading}
          id="email"
          placeholder="New email address"
          className="mt-2"
          name="email"
        />
        {isFormValidationActionError(fetcher.data) &&
          fetcher.data.formValidationError.email?._errors && (
            <ErrorList
              errors={fetcher.data.formValidationError.email._errors}
            />
          )}

        <DialogFooter className="mt-6">
          <Button
            loading={loading}
            name="intent"
            value={SettingsAccountProfileRouteIntent.CHECK_FOR_EXISTING_EMAIL}
          >
            Check for existing account
          </Button>
        </DialogFooter>
      </fetcher.Form>
    </DialogContent>
  );
}

function EmailTakenDialogContent() {
  return (
    <DialogContent>
      <DialogHeader>Change email</DialogHeader>
      <DialogDescription>
        This email address is already in use by another account.
      </DialogDescription>
      <DialogDescription>
        If you want to migrate this email address to your current account,
        you'll have to login to the existing account and change the email
        address there.
      </DialogDescription>
      <DialogDescription>
        Alternatively, you can login to the existing account and delete it
        entirely.
      </DialogDescription>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary">I understand</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}

function EmailChangeAlreadyInProgressDialogContent({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [isActionDataFresh, setIsActionDataFresh] = useState(false);

  const fetcher = useFetcherWithReset<typeof cancelOngoingEmailChange>({
    key: SettingsAccountProfileRouteIntent.CANCEL_ONGOING_EMAIL_CHANGE,
  });

  useEffect(() => {
    if (fetcher.state === "submitting") setIsActionDataFresh(true);
  }, [fetcher.state]);

  useEffect(() => {
    if (fetcher.data && "success" in fetcher.data && isActionDataFresh) {
      setIsActionDataFresh(false);
      if (fetcher.data.success) {
        toast.success(
          "Your ongoing email change has been successfully canceled.",
        );

        onSuccess();
      }
    }
  }, [fetcher.data, isActionDataFresh, onSuccess]);

  const loading = fetcher.state !== "idle";

  return (
    <DialogContent>
      <DialogHeader>Email change in progress</DialogHeader>
      <DialogDescription>
        You currently have an email change in progress and should have received
        a verification link in your inbox.
      </DialogDescription>
      <DialogDescription>
        If you would like to cancel this ongoing email change, please continue
        below.
      </DialogDescription>
      <DialogFooter>
        <fetcher.Form method="POST" className="w-full">
          <Button
            fullWidth
            variant="destructive"
            loading={loading}
            name="intent"
            value={
              SettingsAccountProfileRouteIntent.CANCEL_ONGOING_EMAIL_CHANGE
            }
          >
            Cancel ongonig email change
          </Button>
        </fetcher.Form>
      </DialogFooter>
    </DialogContent>
  );
}
