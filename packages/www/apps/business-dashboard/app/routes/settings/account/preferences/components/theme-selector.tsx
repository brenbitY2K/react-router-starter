import { useFetcher, useLoaderData } from "react-router";
import { GLOBAL_FETCHER_KEY } from "~/fetcher-keys.js";
import { AccountPreferencesRouteIntent, type loader } from "../preferences-route.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@www/ui/select";

export function ThemeSelector() {
  const { activeTheme } = useLoaderData<typeof loader>();

  const setThemeFetcher = useFetcher({ key: GLOBAL_FETCHER_KEY.SET_THEME });

  function handleThemeSelect(theme: string) {
    const formData = new FormData();
    formData.set("theme", theme);
    formData.set("intent", AccountPreferencesRouteIntent.SELECT_THEME);

    setThemeFetcher.submit(formData, { method: "POST" });
  }

  return (
    <div className="space-y-2">
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Theme</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Interface theme</h3>
              <p className="text-muted-foreground text-sm">
                Select or customize your interface color scheme.
              </p>
            </div>
            <Select
              onValueChange={(value) => handleThemeSelect(value)}
              defaultValue={activeTheme}
            >
              <SelectTrigger id="interface-theme" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System preference</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
