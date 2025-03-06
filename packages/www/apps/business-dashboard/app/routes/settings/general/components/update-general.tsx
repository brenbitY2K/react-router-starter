import { Button } from "@www/ui/button";
import { Input } from "@www/ui/input";
import { Label } from "@www/ui/label";
import { useLoaderData } from "react-router";
import { SettingsGeneralRouteIntent, type loader } from "../general-route.js";
import { useFetcherWithReset } from "~/hooks/action.js";
import { type updateGeneral } from "../actions/update-general.js";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { isFormValidationActionError } from "~/utils/response.js";
import { ErrorList } from "~/components/forms.js";

export function UpdateGeneralSettings() {
  const loaderData = useLoaderData<typeof loader>();
  const [slug, setSlug] = useState(loaderData.teamSlug);
  const [isActionDataFresh, setIsActionDataFresh] = useState(false);

  const fetcher = useFetcherWithReset<typeof updateGeneral>({
    key: SettingsGeneralRouteIntent.UPDATE_GENERAL,
  });

  useEffect(() => {
    if (fetcher.state === "submitting") setIsActionDataFresh(true);
  }, [fetcher.state]);

  useEffect(() => {
    if (fetcher.data && "success" in fetcher.data) {
      setIsActionDataFresh(false);
      if (fetcher.data.success) {
        toast.success("Your team information has been successfully updated");
      }
    }
  }, [fetcher.data, isActionDataFresh]);

  const loading = fetcher.state !== "idle";

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(
      e.target.value
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, ""),
    );
  }

  return (
    <fetcher.Form method="POST" className="space-y-4">
      <h2 className="text-xl font-semibold">General</h2>
      <div className="space-y-2">
        <Label htmlFor="team-name">Team</Label>
        <Input
          id="teamName"
          name="teamName"
          placeholder="Team name"
          defaultValue={loaderData.teamName}
        />
        {isFormValidationActionError(fetcher.data) && (
          <ErrorList
            errors={fetcher.data.formValidationError.teamName?._errors}
          />
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="team-url">Team URL</Label>
        <Input
          adornmentWidth={82}
          id="teamSlug"
          startAdornment="app.acme.ai/"
          name="teamSlug"
          onChange={handleSlugChange}
          value={slug}
        />
        {isFormValidationActionError(fetcher.data) &&
          fetcher.data.formValidationError.teamSlug?._errors && (
            <ErrorList
              errors={fetcher.data.formValidationError.teamSlug._errors}
            />
          )}
      </div>
      <Button
        type="submit"
        name="intent"
        value={SettingsGeneralRouteIntent.UPDATE_GENERAL}
        loading={loading}
      >
        Update
      </Button>
    </fetcher.Form>
  );
}
