import { useFetcher, useRouteLoaderData } from "react-router";
import { useEffect, useState } from "react";
import { DEFAULT_THEME, type loader } from "~/root.js";
import { GLOBAL_FETCHER_KEY } from "~/fetcher-keys.js";

export function useRootTheme() {
  const loaderData = useRouteLoaderData<typeof loader>("root");
  const [theme, setTheme] = useState(loaderData?.activeTheme ?? DEFAULT_THEME);

  const fetcherChangingActiveTheme = useFetcher({
    key: GLOBAL_FETCHER_KEY.SET_THEME,
  });

  useEffect(() => {
    const applyTheme = (theme: string) => {
      document.body.classList.remove("light", "dark", "system");
      if (theme === "system") {
        const isDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        document.body.classList.add(isDark ? "dark" : "light");
      } else {
        document.body.classList.add(theme);
      }
    };

    applyTheme(theme);

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme("system");
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  useEffect(() => {
    setTheme(loaderData?.activeTheme ?? DEFAULT_THEME);
  }, [loaderData?.activeTheme]);

  useEffect(() => {
    const activeTheme = fetcherChangingActiveTheme.formData?.get(
      "theme",
    ) as string;

    if (activeTheme) {
      setTheme(activeTheme);
    }
  }, [fetcherChangingActiveTheme]);

  return theme;
}

export function useSystemPrefersDarkMode() {
  const [systemPrefersDarkMode, setSystemPrefersDarkMode] = useState(false);

  useEffect(() => {
    const applyTheme = () => {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setSystemPrefersDarkMode(prefersDark);
    };

    applyTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", applyTheme);

    return () => {
      mediaQuery.removeEventListener("change", applyTheme);
    };
  }, []);

  return systemPrefersDarkMode;
}

export function useCoreColorsBasedOnSystemPreference() {
  const systemPrefersDarkMode = useSystemPrefersDarkMode();

  const base100 = systemPrefersDarkMode ? "base-100-dark" : "base-100-light";

  const primary = systemPrefersDarkMode ? "primary-dark" : "primary-light";

  const accent = systemPrefersDarkMode ? "accent-dark" : "accent-light";

  const foreground = systemPrefersDarkMode
    ? "foreground-dark"
    : "foreground-light";

  return { foreground, base100, primary, accent };
}
