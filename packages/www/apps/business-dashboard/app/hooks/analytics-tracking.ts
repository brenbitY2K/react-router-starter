import { useEffect } from "react";
import { useLocation } from "react-router";
import { checkIfEnvSupportsGA4 } from "~/utils/analytics/google/ga4.js";

export function useGA4PageView() {
  const location = useLocation();

  useEffect(() => {
    if (!checkIfEnvSupportsGA4()) return;
    if (typeof window.gtag !== "undefined") {
      window.gtag("event", "page_view", {
        page_title: document.title,
        page_location: window.location.href, // Full URL
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);
}

export function useGA4TeamSlugPageView({ teamSlug }: { teamSlug: string }) {
  const location = useLocation();

  useEffect(() => {
    if (!checkIfEnvSupportsGA4()) return;
    if (typeof window.gtag !== "undefined" && teamSlug) {
      const normalizedPath = location.pathname.replace(
        `/${teamSlug}/`,
        "/team-slug/",
      );

      window.gtag("event", "page_view", {
        page_title: document.title,
        page_location: window.location.href.replace(teamSlug, "team-slug"),
        page_path: normalizedPath + location.search,
      });
    }
  }, [location, teamSlug]);
}
