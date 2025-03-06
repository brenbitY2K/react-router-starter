import { type sessions } from "@acme/database/schema";
import { type SessionData, type SessionStorage } from "react-router";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";
import UAParser from "ua-parser-js";
import { serverConfig } from "~/config.server.js";
import { type Logger } from "~/logging/index.js";
import { currentUserSessionStorage } from "~/sessions/auth.server.js";

export function getSessionFromRequest(
  storage: SessionStorage,
  request: Request,
) {
  const cookie = request.headers.get("Cookie");

  return storage.getSession(cookie);
}

// expiresAt is omitted b/c it's set by the cookie expiration.
export type CreateAuthSessionData = Omit<
  typeof sessions.$inferInsert,
  "id" | "createdAt" | "updatedAt" | "expiresAt"
>;

export async function createNewAuthSessionAndSetActiveUser({
  data,
  authSessionStorage,
  cookieHeader,
}: {
  data: CreateAuthSessionData;
  authSessionStorage: SessionStorage<SessionData>;
  cookieHeader: string | null;
}) {
  const session = await authSessionStorage.getSession(cookieHeader);
  session.set("userId", data.userId);
  session.set("ip", data.ip);
  session.set("ipCity", data.ipCity);
  session.set("ipCountryCode", data.ipCountryCode);
  session.set("ipCountryName", data.ipCountryName);
  session.set("ipRegionCode", data.ipRegionCode);
  session.set("ipRegionName", data.ipRegionName);
  session.set("ipLatitude", data.ipLatitude);
  session.set("ipLongitude", data.ipLongitude);
  session.set("userAgentOS", data.userAgentOS);
  session.set("userAgentBrowser", data.userAgentBrowser);

  const currentUserSession =
    await currentUserSessionStorage.getSession(cookieHeader);
  currentUserSession.set("id", data.userId);

  return {
    authSession: session,
    currentUserSession,
  };
}

type IpResponse = {
  ip?: string;
  country_code?: string;
  country_name?: string;
  region_code?: string;
  region_name?: string;
  city?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
};

export type SessionClientInformation = Omit<CreateAuthSessionData, "userId">;

async function fetchIpInfo(ip: string) {
  const response = await fetch(
    `https://api.ipapi.com/api/${ip}?access_key=${serverConfig.ipapiAccessKey}`,
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = (await response.json()) as IpResponse;

  return {
    ip,
    ipCountryCode: data?.country_code,
    ipCity: data?.city,
    ipCountryName: data?.country_name,
    ipRegionCode: data?.region_code,
    ipRegionName: data?.region_name,
    ipLatitude: data?.latitude != undefined ? String(data.latitude) : undefined,
    ipLongitude:
      data?.longitude != undefined ? String(data.longitude) : undefined,
  };
}

function parseUserAgent(
  userAgent: string,
): Pick<SessionClientInformation, "userAgentBrowser" | "userAgentOS"> {
  const parser = new UAParser(userAgent);
  return {
    userAgentBrowser: parser.getBrowser().name || undefined,
    userAgentOS: parser.getOS().name || undefined,
  };
}

export async function getClientInformationForSession({
  request,
  logger,
}: {
  request: Request;
  logger: Logger;
}): Promise<SessionClientInformation> {
  let clientInfo: SessionClientInformation = {};
  const ip = getClientIPAddress(request);

  try {
    if (ip) {
      const ipInfo = await fetchIpInfo(ip);
      clientInfo = { ...ipInfo };
    }
  } catch (error) {
    logger.error("Failed to fetch IP info", { error, ip });
  }

  const userAgent = request.headers.get("User-Agent");
  if (userAgent) {
    const userAgentInfo = parseUserAgent(userAgent);
    clientInfo = { ...clientInfo, ...userAgentInfo };
  }

  return clientInfo;
}
