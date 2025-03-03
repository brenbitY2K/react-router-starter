import { redirect, type LoaderFunctionArgs } from "react-router";
import {
  googleOauthCodeVerifier,
  googleOauthState,
  oauthRequestOrigin,
  oauthRequestReturToPath,
  type SetCookieHeader,
} from "~/cookies.server.js";
import { google } from "~/lib/oauth/google.js";
import { CustomerRepository } from "~/repositories/customers.server.js";
import { fetchGoogleUser, redirectWithBaseGoogleError } from "./utils.js";
import { OAuthAccountRepository } from "~/repositories/oauth-accounts.server.js";
import { UserRepository } from "~/repositories/users.server.js";
import { OAuthService } from "~/services/oauth.server.js";
import { createLoaderLogger } from "~/utils/loaders.server.js";
import { type GoogleTokens } from "arctic";
import { requireUserFromSession } from "~/utils/auth/loaders.server.js";
import { users } from "@acme/database/schema";
import { redirectWithToast } from "remix-toast";
import { getClientInformationForSession } from "~/utils/sessions.server.js";
import { SessionRepository } from "~/repositories/sessions.server.js";

export const loader = async (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);
  const url = new URL(args.request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieHeader = args.request.headers.get("Cookie");

  const originFromCookie = ((await oauthRequestOrigin.parse(cookieHeader)) ??
    "/login") as string;

  const returnToPathFromCookie =
    await oauthRequestReturToPath.parse(cookieHeader);

  const buildErrorRedirect = () => {
    const searchParams = new URLSearchParams();
    if (returnToPathFromCookie) {
      searchParams.set("returnTo", returnToPathFromCookie);
    }
    const search = searchParams.toString();
    return `${originFromCookie}${search ? `?${search}` : ""}`;
  };

  if (url.searchParams.get("error")) {
    throw await redirectWithBaseGoogleError(buildErrorRedirect());
  }

  const storedState =
    ((await googleOauthState.parse(cookieHeader)) as string | null) ?? null;

  const storedCodeVerifier =
    ((await googleOauthCodeVerifier.parse(cookieHeader)) as string | null) ??
    null;

  if (
    !code ||
    !state ||
    !storedState ||
    state !== storedState ||
    !storedCodeVerifier
  ) {
    throw await redirectWithBaseGoogleError(buildErrorRedirect());
  }

  const resetCookieHeaders: SetCookieHeader[] = [
    ["Set-Cookie", await googleOauthCodeVerifier.serialize("", { maxAge: 1 })],
    ["Set-Cookie", await googleOauthState.serialize("", { maxAge: 1 })],
    ["Set-Cookie", await oauthRequestOrigin.serialize("", { maxAge: 1 })],
  ];

  let tokens: GoogleTokens;
  try {
    tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
  } catch (e) {
    throw await redirectWithBaseGoogleError(buildErrorRedirect());
  }

  const clientInfo = await getClientInformationForSession({
    request: args.request,
    logger,
  });

  const oAuthService = new OAuthService({
    sessionRepo: new SessionRepository(),
    logger,
    clientInfo,
    oAuthAccountRepo: new OAuthAccountRepository(),
    customerRepo: new CustomerRepository(),
    userRepo: new UserRepository(),
  });

  // We're linking an account to an already logged in user.
  if (originFromCookie.includes("/settings/account/profile")) {
    try {
      const user = await requireUserFromSession({
        args,
        logger,
        projection: { id: users.id },
      });

      await oAuthService.connectGoogleAccountToLoggedInUser({
        userId: user.id,
        baseThrower: async () => {
          throw await redirectWithBaseGoogleError(buildErrorRedirect());
        },
        tokens,
        userFetcher: fetchGoogleUser,
      });
      throw await redirectWithToast(originFromCookie, {
        type: "success",
        message: "Your Google account is now connected.",
      });
    } catch (e) {
      if (e instanceof Response) {
        throw e;
      }

      throw await redirectWithBaseGoogleError(buildErrorRedirect());
    }
  }

  const { setCookieHeaders } = await oAuthService.loginWithGoogle({
    cookieHeader: args.request.headers.get("Cookie"),
    baseThrower: async () => {
      throw await redirectWithBaseGoogleError(buildErrorRedirect());
    },
    tokens,
    userFetcher: fetchGoogleUser,
  });

  if (returnToPathFromCookie) {
    throw redirect(returnToPathFromCookie, {
      headers: [...setCookieHeaders, ...resetCookieHeaders],
    });
  }

  const redirectPath = originFromCookie.includes("/map/demo")
    ? "/map/demo/preferences"
    : "/flow-selector";

  throw redirect(redirectPath, {
    headers: [...setCookieHeaders, ...resetCookieHeaders],
  });
};
