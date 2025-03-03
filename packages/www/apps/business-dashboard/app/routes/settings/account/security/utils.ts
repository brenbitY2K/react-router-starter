import {
  SiGooglechrome,
  SiSafari,
  SiFirefox,
  SiOpera,
  SiBrave,
  SiVivaldi,
  SiDuckduckgo,
  SiTorbrowser,
} from "@icons-pack/react-simple-icons";

export function getLastSeenString(date: Date | null): string {
  if (date == null) return "Last seen unknown";
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `Last seen ${diffInSeconds} second${diffInSeconds !== 1 ? "s" : ""} ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Last seen ${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Last seen ${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `Last seen ${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
}

export function getLocationTextForSession({
  ipCountryCode,
  ipCity,
}: {
  ipCountryCode: string | undefined | null;
  ipCity: string | undefined | null;
}) {
  return ipCity && ipCountryCode
    ? `${ipCity}, ${ipCountryCode}`
    : "Unknown location";
}

export function getDeviceTextForSession({
  userAgentOS,
  userAgentBrowser,
}: {
  userAgentBrowser: string | null | undefined;
  userAgentOS: string | null | undefined;
}) {
  return userAgentOS && userAgentBrowser
    ? `${userAgentBrowser} on ${userAgentOS}`
    : "Unknown location";
}

const browserIconMap = [
  { keywords: ["chrome", "chromium"], icon: SiGooglechrome },
  { keywords: ["safari"], icon: SiSafari },
  { keywords: ["firefox"], icon: SiFirefox },
  { keywords: ["opera"], icon: SiOpera },
  { keywords: ["brave"], icon: SiBrave },
  { keywords: ["vivaldi"], icon: SiVivaldi },
  { keywords: ["duckduckgo"], icon: SiDuckduckgo },
  { keywords: ["tor"], icon: SiTorbrowser },
];

export function getBrowserIcon(browserName: string | null) {
  if (browserName === null) return SiGooglechrome;
  const lowerBrowserName = browserName.toLowerCase();
  const match = browserIconMap.find((item) =>
    item.keywords.some((keyword) => lowerBrowserName.includes(keyword)),
  );
  return match ? match.icon : SiGooglechrome; // Default to Chrome icon if no match
}
