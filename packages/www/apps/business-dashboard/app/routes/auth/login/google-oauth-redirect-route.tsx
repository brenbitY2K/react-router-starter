import { type LoaderFunctionArgs, redirect } from "react-router";
import { generateCodeVerifier, generateState } from "arctic";
import {
  googleOauthCodeVerifier,
  googleOauthState,
  oauthRequestOrigin,
  oauthRequestReturToPath,
} from "~/cookies.server.js";
import { google } from "~/lib/oauth/google.js";

export const loader = async (args: LoaderFunctionArgs) => {
  const referer = args.request.headers.get("referer");
  let refererPath = "/login";
  const url = new URL(args.request.url);
  const returnTo = url.searchParams.get("returnTo");

  if (referer) {
    try {
      const url = new URL(referer);
      refererPath = url.pathname;
    } catch (error) {}
  }

  let returnToPath = null;
  if (returnTo && returnTo.startsWith("/") && !returnTo.includes("://")) {
    returnToPath = returnTo;
  }

  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const googleUrl = await google.createAuthorizationURL(state, codeVerifier, {
    scopes: ["profile", "email"],
  });

  throw redirect(googleUrl.toString(), {
    headers: [
      ["Set-Cookie", await googleOauthState.serialize(state)],
      ["Set-Cookie", await oauthRequestOrigin.serialize(refererPath)],
      ["Set-Cookie", await oauthRequestReturToPath.serialize(returnToPath)],
      ["Set-Cookie", await googleOauthCodeVerifier.serialize(codeVerifier)],
    ],
  });
};
