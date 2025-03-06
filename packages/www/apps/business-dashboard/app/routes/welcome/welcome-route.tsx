import { Button } from "@www/ui/button";
import {
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigation,
} from "react-router";
import { type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { requireCustomer } from "~/utils/auth/loaders.server.js";
import { customers } from "@acme/database/schema";
import { ErrorList } from "~/components/forms.js";
import {
  actionWithDefaultErrorHandling,
  getActionIntent,
} from "~/utils/actions.server.js";
import { isFormValidationActionError } from "~/utils/response.js";
import { createLoaderLogger } from "~/utils/loaders.server.js";
import { selectTheme } from "./actions/select-theme.js";
import { type Logger } from "~/logging/index.js";
import { GLOBAL_FETCHER_KEY } from "~/fetcher-keys.js";
import { useState } from "react";
import { useCoreColorsBasedOnSystemPreference } from "~/hooks/theme.js";
import { DEFAULT_THEME } from "~/root.js";

export const loader = async (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);
  const customer = await requireCustomer({
    args,
    logger,
    projection: { activeTheme: customers.activeTheme },
  });

  return {
    activeTheme: customer.activeTheme ?? DEFAULT_THEME,
  };
};

export enum WelcomeRouteIntent {
  SELECT_THEME = "welcome_select_theme",
}

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    const intent = await getActionIntent(args.request);
    if (intent === WelcomeRouteIntent.SELECT_THEME)
      return await selectTheme(args, logger);
  },
);

export default function Welcome() {
  const [currentStep, setCurrentStep] = useState("welcome");

  return (
    <div className="bg-base-100 flex h-screen flex-col items-center justify-center">
      {currentStep === "style" ? (
        <StyleMode />
      ) : (
        <Start onNext={() => setCurrentStep("style")} />
      )}
    </div>
  );
}

function Start({ onNext }: { onNext: () => void }) {
  return (
    <>
      <h1 className="mb-3 scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
        Welcome to Acme
      </h1>
      <p className="text-muted-foreground">The Future of Land Acquisition</p>
      <Button className="mt-6 w-60" onClick={onNext}>
        Get started
      </Button>
    </>
  );
}

function StyleMode() {
  const { activeTheme } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof selectTheme>();
  const navigation = useNavigation();

  const setThemeFetcher = useFetcher({ key: GLOBAL_FETCHER_KEY.SET_THEME });

  function handleThemeSelect(theme: string) {
    const formData = new FormData();
    formData.set("theme", theme);
    formData.set("intent", WelcomeRouteIntent.SELECT_THEME);

    setThemeFetcher.submit(formData, { method: "POST" });
  }

  const systemColor = useCoreColorsBasedOnSystemPreference();

  return (
    <>
      <div className="text-center">
        <h1 className="mb-2 text-2xl font-bold">Choose your style</h1>
        <p className="text-muted-foreground">
          Change your theme at any time via the settings.
        </p>
      </div>
      <setThemeFetcher.Form
        className="flex flex-col items-center"
        method="post"
      >
        <input
          type="hidden"
          name="intent"
          value={WelcomeRouteIntent.SELECT_THEME}
        />
        <div className="mt-8 flex flex-col items-center space-y-4">
          <label className="flex flex-col items-center">
            <input
              type="radio"
              name="theme"
              value="system"
              onChange={() => handleThemeSelect("system")}
              className="peer hidden"
              defaultChecked={activeTheme === "system"}
            />
            <div
              className={`border-border peer-checked:border-primary bg-${systemColor.base100} flex w-80 cursor-pointer items-center space-x-4 rounded-lg border border-2 p-6`}
            >
              <div className="flex space-x-2">
                <div
                  className={`bg-${systemColor.primary} light h-6 w-2 rounded-md`}
                />
                <div
                  className={`bg-${systemColor.accent} light h-6 w-2 rounded-md`}
                />
              </div>
              <p className={`text-${systemColor.foreground} text-sm font-bold`}>
                System
              </p>
            </div>
          </label>
          <label className="flex flex-col items-center">
            <input
              type="radio"
              name="theme"
              value="light"
              className="peer hidden"
              onChange={() => handleThemeSelect("light")}
              defaultChecked={activeTheme === "light"}
            />
            <div className="border-border peer-checked:border-primary bg-base-100-light flex w-80 cursor-pointer items-center space-x-4 rounded-lg border border-2 p-6">
              <div className="flex space-x-2">
                <div className="bg-primary-light h-6 w-2 rounded-md" />
                <div className="bg-accent-light h-6 w-2 rounded-md" />
              </div>
              <p className="text-foreground-light text-sm font-bold">Light</p>
            </div>
          </label>
          <label className="flex flex-col items-center">
            <input
              type="radio"
              name="theme"
              value="dark"
              onChange={() => handleThemeSelect("dark")}
              className="peer hidden"
              defaultChecked={activeTheme === "dark"}
            />
            <div className="border-border peer-checked:border-primary bg-base-100-dark flex w-80 cursor-pointer items-center space-x-4 rounded-lg border border-2 p-6">
              <div className="flex space-x-2">
                <div className="bg-primary-dark light h-6 w-2 rounded-md" />
                <div className="bg-accent-dark h-6 w-2 rounded-md" />
              </div>
              <p className="text-foreground-dark text-sm font-bold">Dark</p>
            </div>
          </label>
        </div>
        {isFormValidationActionError(actionData) && (
          <ErrorList errors={actionData.formValidationError.theme?._errors} />
        )}
      </setThemeFetcher.Form>
      <Link to="/welcome/role-selection">
        <Button className="mt-8 w-60" loading={navigation.state === "loading"}>
          Continue
        </Button>
      </Link>
    </>
  );
}
