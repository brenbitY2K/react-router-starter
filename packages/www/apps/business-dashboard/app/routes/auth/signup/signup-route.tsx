import { Link, useFetcher, useLoaderData, useLocation } from "react-router";
import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  data,
} from "react-router";
import { LogInIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { type Logger } from "~/logging/index.js";
import {
  actionWithDefaultErrorHandling,
  getActionIntent,
} from "~/utils/actions.server.js";
import { sendEmailCode } from "./actions/send-email-code.js";
import {
  AuthOptionsButtonList,
  VerifyEmailOTPView,
} from "~/components/auth-forms.js";
import { isFormValidationActionError } from "~/utils/response.js";
import { verifyEmailCode } from "./actions/verify-email-code.js";
import { getToast } from "remix-toast";
import { toast } from "sonner";
import { requireRerouteIfLoggedIn } from "~/utils/auth/loaders.server.js";
import { createLoaderLogger } from "~/utils/loaders.server.js";

export enum SignupRouteIntent {
  SEND_EMAIL_CODE = "signup_route_send_email_code",
  VERIFY_CODE = "signup_route_send_verify_code",
}

export const loader = async (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);
  await requireRerouteIfLoggedIn({
    logger,
    args,
    redirectPath: "/flow-selector",
  });

  const { toast, headers } = await getToast(args.request);
  return data({ toast }, { headers });
};

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    const intent = await getActionIntent(args.request);

    if (intent === SignupRouteIntent.SEND_EMAIL_CODE)
      return await sendEmailCode(args, logger);
    if (intent === SignupRouteIntent.VERIFY_CODE)
      return await verifyEmailCode(args, logger);
  },
);

export default function Signup() {
  const location = useLocation();
  const [showEmailOTPView, setShowEmailOTPView] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const loaderData = useLoaderData<typeof loader>();

  useEffect(() => {
    if (loaderData.toast?.type === "error") {
      toast.error(loaderData.toast.message);
    }
    if (loaderData.toast?.type === "info") {
      toast.info(loaderData.toast.message);
    }
  }, [loaderData.toast]);

  const sendEmailCodeFetcher = useFetcher<typeof sendEmailCode>({
    key: SignupRouteIntent.SEND_EMAIL_CODE,
  });

  const verifyCodeFetcher = useFetcher<typeof verifyEmailCode>({
    key: SignupRouteIntent.VERIFY_CODE,
  });

  useEffect(() => {
    if (
      sendEmailCodeFetcher.state === "idle" &&
      sendEmailCodeFetcher.data !== undefined &&
      "success" in sendEmailCodeFetcher.data &&
      sendEmailCodeFetcher.data.success === true
    ) {
      setShowEmailOTPView(true);
    }
  }, [sendEmailCodeFetcher.state, sendEmailCodeFetcher.data]);

  if (showEmailOTPView)
    return (
      <VerifyEmailOTPView
        email={email}
        name={name}
        formValidationErrors={
          isFormValidationActionError(verifyCodeFetcher.data)
            ? verifyCodeFetcher.data.formValidationError
            : undefined
        }
        verifyCodeIntent={SignupRouteIntent.VERIFY_CODE}
        onCancel={() => setShowEmailOTPView(false)}
      />
    );

  return (
    <div className="mx-auto flex min-h-screen max-w-xs flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-6">
        <div className="bg-foreground flex h-16 w-16 items-center justify-center rounded-full">
          <LogInIcon className="text-base-100 h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <AuthOptionsButtonList
          email={email}
          name={name}
          mode="signup"
          formValidationErrors={
            isFormValidationActionError(sendEmailCodeFetcher.data)
              ? sendEmailCodeFetcher.data.formValidationError
              : undefined
          }
          sendEmailCodeIntent={SignupRouteIntent.SEND_EMAIL_CODE}
          onEmailChange={setEmail}
          onNameChange={setName}
        />
        <p className="text-muted-foreground text-center text-sm">
          By signing up, you agree to our{" "}
          <a href="TODO" className="text-foreground">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="TODO" className="text-foreground">
            Data Processing Agreement
          </a>
          .
        </p>
        <div className="text-muted-foreground text-center text-2xl">-</div>
        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{" "}
          <Link
            to={`/login${location.search ? `${location.search}` : ""}`}
            className="text-foreground"
          >
            Login
          </Link>{" "}
          →
        </p>
      </div>
    </div>
  );
}
