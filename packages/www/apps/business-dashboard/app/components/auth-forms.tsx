import { Link, useFetcher, useLocation } from "react-router";
import { Button } from "@www/ui/button";
import { Input } from "@www/ui/input";
import { Separator } from "@www/ui/separator";
import { LogInIcon } from "lucide-react";
import { useState } from "react";
import { ErrorList } from "./forms.js";
import { type ZodFormattedError } from "zod";
import { trackGA4Event } from "~/utils/analytics/google/ga4.js";

export function AuthOptionsButtonList({
  email,
  formValidationErrors,
  sendEmailCodeIntent,
  onEmailChange,
  onNameChange,
  mode,
  name,
}: {
  email: string;
  name?: string;
  mode: "login" | "signup";
  formValidationErrors:
    | ZodFormattedError<
        {
          email: string;
          name?: string;
        },
        string
      >
    | undefined;
  onEmailChange: (email: string) => void;
  onNameChange?: (name: string) => void;
  sendEmailCodeIntent: string;
}) {
  const [showEmailInput, setShowEmailInput] = useState(false);
  const sendEmailCodeFetcher = useFetcher({ key: sendEmailCodeIntent });
  const location = useLocation();

  function handleShowEmailInputButtonClick() {
    handleSignupEvent("email");

    if (!showEmailInput) {
      setShowEmailInput(true);
      return;
    }
  }

  function handleSignupEvent(method: "google" | "email") {
    if (mode === "signup") {
      trackGA4Event("sign_up", { method });
    }
  }

  return (
    <div className="w-full space-y-4">
      <Link
        to={`/login/google${location.search ? `${location.search}` : ""}`}
        onClick={() => handleSignupEvent("google")}
        className="w-full"
      >
        <Button variant="default" className="w-full">
          Continue with Google
        </Button>
      </Link>
      {showEmailInput ? (
        <sendEmailCodeFetcher.Form className="w-full space-y-4" method="POST">
          <Separator />
          <Input
            placeholder="Enter your email address..."
            name="email"
            value={email}
            onChange={(e) => {
              const formattedValue = e.target.value
                .toLowerCase()
                .replace(/\s+/g, "");
              onEmailChange(formattedValue);
            }}
          />
          {formValidationErrors?.email?._errors && (
            <ErrorList errors={formValidationErrors.email._errors} />
          )}

          {mode === "signup" &&
          name !== undefined &&
          onNameChange !== undefined ? (
            <>
              <Input
                placeholder="Enter your name..."
                name="name"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
              />
              {formValidationErrors?.name?._errors && (
                <ErrorList errors={formValidationErrors.name._errors} />
              )}
            </>
          ) : null}

          <input type="hidden" name="intent" value={sendEmailCodeIntent} />

          <Button
            variant="secondary"
            className="w-full"
            type="submit"
            loading={sendEmailCodeFetcher.state !== "idle"}
          >
            Continue with Email
          </Button>
        </sendEmailCodeFetcher.Form>
      ) : (
        <Button
          variant="secondary"
          className="w-full"
          type="button"
          onClick={handleShowEmailInputButtonClick}
        >
          Continue with Email
        </Button>
      )}
    </div>
  );
}

export function VerifyEmailOTPView({
  email,
  name,
  formValidationErrors,
  verifyCodeIntent,
  fullHeight = true,
  onCancel,
}: {
  email: string;
  name?: string;
  formValidationErrors:
    | ZodFormattedError<
        {
          email: string;
          name?: string;
          code: string;
        },
        string
      >
    | undefined;
  verifyCodeIntent: string;
  fullHeight?: boolean;
  onCancel: () => void;
}) {
  const [showManualEntry, setShowManualEntry] = useState(false);
  const verifyCodeFetcher = useFetcher({ key: verifyCodeIntent });

  return (
    <div
      className={`flex ${fullHeight ? "min-h-screen" : ""} flex-col items-center justify-center`}
    >
      <div className="flex flex-col items-center space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
          <LogInIcon className="h-8 w-8 text-black" />
        </div>
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="text-muted-foreground text-center">
          We've sent a temporary login link. <br />
          Please check your inbox at{" "}
          <span className="font-semibold">{email}</span>.
        </p>
        <div className="flex flex-col items-center space-y-2">
          {showManualEntry ? (
            <verifyCodeFetcher.Form className="space-y-4" method="POST">
              <Input
                placeholder="Enter code"
                className="w-full p-6 text-center text-xl"
                name="code"
              />
              <input type="hidden" name="email" value={email} />
              {formValidationErrors && (
                <ErrorList errors={formValidationErrors.email?._errors} />
              )}
              {name !== undefined ? (
                <>
                  <input type="hidden" name="name" value={name} />
                  {formValidationErrors && (
                    <ErrorList errors={formValidationErrors.name?._errors} />
                  )}
                </>
              ) : null}
              <input type="hidden" name="intent" value={verifyCodeIntent} />
              <Button
                className="w-full"
                loading={verifyCodeFetcher.state !== "idle"}
                type="submit"
              >
                Continue with login code
              </Button>
            </verifyCodeFetcher.Form>
          ) : (
            <Button variant="ghost" onClick={() => setShowManualEntry(true)}>
              Enter code manually
            </Button>
          )}
          <Button variant="ghost" onClick={onCancel}>
            Back to login
          </Button>
        </div>
      </div>
    </div>
  );
}
