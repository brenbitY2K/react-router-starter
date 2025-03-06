import {
  type ActionFunctionArgs,
  data,
  type LoaderFunctionArgs,
} from "react-router";
import { LogInIcon } from "lucide-react";
import {
  AuthOptionsButtonList,
  VerifyEmailOTPView,
} from "~/components/auth-forms.js";
import { useEffect, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { isFormValidationActionError } from "~/utils/response.js";
import {
  actionWithDefaultErrorHandling,
  getActionIntent,
} from "~/utils/actions.server.js";
import { type Logger } from "~/logging/index.js";
import { sendEmailCode } from "./actions/send-email-code.js";
import { verifyEmailCode } from "./actions/verify-email-code.js";
import { getToast } from "remix-toast";
import { toast } from "sonner";

export const loader = async (args: LoaderFunctionArgs) => {
  const { toast, headers } = await getToast(args.request);
  return data({ toast }, { headers });
};

export enum LoginRouteIntent {
  SEND_EMAIL_CODE = "login_route_send_email_code",
  VERIFY_CODE = "login_route_send_verify_code",
}

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    const intent = await getActionIntent(args.request);
    if (intent === LoginRouteIntent.SEND_EMAIL_CODE)
      return await sendEmailCode(args, logger);
    if (intent === LoginRouteIntent.VERIFY_CODE)
      return await verifyEmailCode(args, logger);
  },
);

export default function Login() {
  const [showEmailOTPView, setShowEmailOTPView] = useState(false);
  const [email, setEmail] = useState("");

  const loaderData = useLoaderData<typeof loader>();

  const sendEmailCodeFetcher = useFetcher<typeof sendEmailCode>({
    key: LoginRouteIntent.SEND_EMAIL_CODE,
  });

  const verifyCodeFetcher = useFetcher<typeof verifyEmailCode>({
    key: LoginRouteIntent.VERIFY_CODE,
  });

  useEffect(() => {
    if (loaderData.toast?.type === "error") {
      toast.error(loaderData.toast.message);
    }
    if (loaderData.toast?.type === "info") {
      toast.info(loaderData.toast.message);
    }
  }, [loaderData.toast]);

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
        formValidationErrors={
          isFormValidationActionError(verifyCodeFetcher.data)
            ? verifyCodeFetcher.data.formValidationError
            : undefined
        }
        verifyCodeIntent={LoginRouteIntent.VERIFY_CODE}
        onCancel={() => setShowEmailOTPView(false)}
      />
    );
  return (
    <div className="flex min-h-screen w-full flex-col justify-between">
      <div className="mx-auto flex w-full max-w-xs flex-1 flex-col items-center justify-center">
        <div className="flex w-full flex-col items-center space-y-6">
          <div className="bg-foreground flex h-16 w-16 items-center justify-center rounded-full">
            <LogInIcon className="text-base-100 h-8 w-8" />
          </div>
          <h1 className="text-2xl font-semibold">Add an account</h1>
          <AuthOptionsButtonList
            email={email}
            mode="login"
            formValidationErrors={
              isFormValidationActionError(sendEmailCodeFetcher.data)
                ? sendEmailCodeFetcher.data.formValidationError
                : undefined
            }
            sendEmailCodeIntent={LoginRouteIntent.SEND_EMAIL_CODE}
            onEmailChange={setEmail}
          />
        </div>
      </div>
    </div>
  );
}
