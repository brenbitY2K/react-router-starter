import type { Route } from "./+types/login-route";
import {
  type ActionFunctionArgs,
  data,
  type LoaderFunctionArgs,
  redirect,
  Link,
  useLocation,
} from "react-router";
import { LogInIcon } from "lucide-react";
import { createLoaderLogger } from "~/utils/loaders.server.js";
import { EmailOTPAuthService } from "~/services/email-otp-auth.server.js";
import { EmailOTPRepository } from "~/repositories/email-otps.server.js";
import { throwNotFoundErrorResponseJsonAndLog } from "~/utils/response.server.js";
import { UserRepository } from "~/repositories/users.server.js";
import {
  currentUserSessionStorage,
  getAuthSessionStorageWithUserId,
} from "~/sessions/auth.server.js";
import { CustomerRepository } from "~/repositories/customers.server.js";
import {
  AuthOptionsButtonList,
  VerifyEmailOTPView,
} from "~/components/auth-forms.js";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
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
import {
  createNewAuthSessionAndSetActiveUser,
  getClientInformationForSession,
} from "~/utils/sessions.server.js";
import { getDataFromJWTOrThrow } from "./utils.js";
import { SessionRepository } from "~/repositories/sessions.server.js";
import { requireRerouteIfLoggedIn } from "~/utils/auth/loaders.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);
  await requireRerouteIfLoggedIn({
    logger,
    args,
    redirectPath: "/flow-selector",
  });

  const token = new URL(args.request.url).searchParams.get("token");
  const redirectPathSearchParam = new URL(args.request.url).searchParams.get(
    "redirect",
  );

  if (token) {
    const { email, code, name } = getDataFromJWTOrThrow({ logger, token });
    const authService = new EmailOTPAuthService({
      logger,
      emailOTPRepository: new EmailOTPRepository(),
    });

    const userId = await authService.verifyEmailOTPForLogin({
      email,
      name,
      code,
      userRepo: new UserRepository(),
      customerRepo: new CustomerRepository(),
      expiredCodeThrower: () => {
        throw throwNotFoundErrorResponseJsonAndLog({
          data: { message: "This login link has expired." },
          logInfo: { logger, event: "email_otp_link_token_invalid" },
        });
      },
      invalidCodeThrower: () => {
        throw throwNotFoundErrorResponseJsonAndLog({
          data: { message: "This login link is invalid." },
          logInfo: { logger, event: "email_otp_link_token_invalid" },
        });
      },
      userDoesNotExistThrower: () => {
        throw throwNotFoundErrorResponseJsonAndLog({
          data: {
            message:
              "A user with this email does not exist. Please create an account first.",
          },
          logInfo: { logger, event: "account_with_email_does_not_exist" },
        });
      },
    });

    const authSessionStorage = getAuthSessionStorageWithUserId({
      userId,
      sessionRepo: new SessionRepository(),
    });

    const clientInfo = await getClientInformationForSession({
      request: args.request,
      logger,
    });
    const { authSession, currentUserSession } =
      await createNewAuthSessionAndSetActiveUser({
        authSessionStorage,
        cookieHeader: args.request.headers.get("Cookie"),
        data: { userId, ...clientInfo },
      });

    const redirectPath = redirectPathSearchParam
      ? redirectPathSearchParam
      : "/";

    throw redirect(redirectPath, {
      headers: [
        ["Set-Cookie", await authSessionStorage.commitSession(authSession)],
        [
          "Set-Cookie",
          await currentUserSessionStorage.commitSession(currentUserSession),
        ],
      ],
    });
  }

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

export default function Login({ loaderData }: Route.ComponentProps) {
  const [showEmailOTPView, setShowEmailOTPView] = useState(false);
  const [email, setEmail] = useState("");
  const location = useLocation();

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
    <div className="mx-auto flex min-h-screen max-w-xs flex-col items-center justify-center">
      <div className="flex w-full flex-col items-center space-y-6">
        <div className="bg-foreground flex h-16 w-16 items-center justify-center rounded-full">
          <LogInIcon className="text-base-100 h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold">Login to Acme</h1>
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
        <p className="text-muted-foreground text-center text-sm">
          Don't have an account?{" "}
          <Link
            to={`/signup${location.search ? `${location.search}` : ""}`}
            className="text-foreground"
          >
            Signup
          </Link>{" "}
          →
        </p>
      </div>
    </div>
  );
}
