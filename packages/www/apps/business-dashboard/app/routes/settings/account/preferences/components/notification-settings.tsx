import { useFetchers, useLoaderData, useSubmit } from "react-router";
import { type loader, AccountPreferencesRouteIntent } from "../preferences-route.js";
import {
  notificationDisplayMap,
  type NotificationId,
  notifications,
} from "~/services/email/notifications.js";
import {
  type CheckedState,
  createInitialCheckedState,
  createNotificationsEnabledMap,
} from "../utils.js";
import { Card, CardContent } from "@www/ui/card";
import { Checkbox } from "@www/ui/checkbox";
import { Separator } from "@www/ui/separator";

export function NotificationSettings() {
  const { notificationSettings } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const fetchers = useFetchers().filter(
    (fetcher) =>
      fetcher.formData &&
      fetcher.formData.get("intent") ===
      AccountPreferencesRouteIntent.TOGGLE_NOTIFICATIONS,
  );

  let notificationEnabledMap =
    createNotificationsEnabledMap(notificationSettings);

  fetchers.forEach((fetcher) => {
    if (fetcher.formData) {
      const optimisticUpdates = fetcher.formData;
      const enabled = fetcher.formData.get("enabled") === "true" ? true : false;

      optimisticUpdates.forEach((value, key) => {
        if (key === "notificationIds[]") {
          notificationEnabledMap[value as NotificationId] = enabled;
        }
      });
    }
  });

  const notificationCheckedState = createInitialCheckedState(
    notificationEnabledMap,
  );

  function submitNotificationChanges(
    notificationIds: string[],
    enabled: boolean,
  ) {
    const formData = new FormData();
    formData.set("intent", AccountPreferencesRouteIntent.TOGGLE_NOTIFICATIONS);
    formData.set("enabled", enabled ? "true" : "false");
    notificationIds.forEach((id) => {
      formData.append(`notificationIds[]`, id);
    });
    submit(formData, { method: "POST", navigate: false });
  }

  return (
    <Card className="bg-base-300 mx-auto mt-10 w-full max-w-3xl">
      <CardContent className="space-y-6 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notifications settings</h2>
          <span>Email</span>
        </div>
        <Separator />
        {Object.entries(notificationDisplayMap).map(
          ([primaryCategory, secondaryCategories]) => (
            <PrimaryCategorySection
              key={primaryCategory}
              primaryCategory={primaryCategory}
              secondaryCategories={secondaryCategories}
              notificationCheckedState={notificationCheckedState}
              submitNotificationChanges={submitNotificationChanges}
            />
          ),
        )}
      </CardContent>
    </Card>
  );
}

interface PrimaryCategorySectionProps {
  primaryCategory: string;
  secondaryCategories: Record<string, string[]>;
  notificationCheckedState: CheckedState;
  submitNotificationChanges: (
    notificationIds: string[],
    enabled: boolean,
  ) => void;
}

export function PrimaryCategorySection({
  primaryCategory,
  secondaryCategories,
  notificationCheckedState,
  submitNotificationChanges,
}: PrimaryCategorySectionProps) {
  const getAllItemKeysForPrimarySelection = (
    primaryCategory: string,
  ): string[] => {
    const result: string[] = [];
    const primaryObj = notificationCheckedState[primaryCategory];
    if (!primaryObj) return result;
    Object.values(primaryObj.items).forEach((secondaryObj) => {
      result.push(...Object.keys(secondaryObj.items));
    });
    return result;
  };

  function handlePrimaryChange() {
    const allChecked = notificationCheckedState[primaryCategory].checked;
    submitNotificationChanges(
      getAllItemKeysForPrimarySelection(primaryCategory),
      !allChecked,
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{primaryCategory}</h3>
        <Checkbox
          checked={notificationCheckedState[primaryCategory]?.checked || false}
          onClick={handlePrimaryChange}
        />
      </div>
      {Object.entries(secondaryCategories).map(
        ([secondaryCategory, notificationKeys]) => (
          <SecondaryCategorySection
            key={secondaryCategory}
            primaryCategory={primaryCategory}
            secondaryCategory={secondaryCategory}
            notificationKeys={notificationKeys as NotificationId[]}
            notificationCheckedState={notificationCheckedState}
            submitNotificationChanges={submitNotificationChanges}
          />
        ),
      )}
      <Separator />
    </div>
  );
}

interface SecondaryCategorySectionProps {
  primaryCategory: string;
  secondaryCategory: string;
  notificationKeys: NotificationId[];
  notificationCheckedState: CheckedState;
  submitNotificationChanges: (
    notificationIds: string[],
    enabled: boolean,
  ) => void;
}

export function SecondaryCategorySection({
  primaryCategory,
  secondaryCategory,
  notificationKeys,
  notificationCheckedState,
  submitNotificationChanges,
}: SecondaryCategorySectionProps) {
  function handleSecondaryChange() {
    const allChecked =
      notificationCheckedState[primaryCategory].items[secondaryCategory]
        .checked;
    submitNotificationChanges(
      Object.keys(
        notificationCheckedState[primaryCategory].items[secondaryCategory]
          .items,
      ),
      !allChecked,
    );
  }

  if (secondaryCategory === "direct") {
    return (
      <div className="ml-4 space-y-2">
        {notificationKeys.map((key) => (
          <NotificationItem
            key={key}
            primaryCategory={primaryCategory}
            secondaryCategory={secondaryCategory}
            notificationKey={key}
            notificationCheckedState={notificationCheckedState}
            submitNotificationChanges={submitNotificationChanges}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium">{secondaryCategory}</h4>
        <Checkbox
          checked={
            notificationCheckedState[primaryCategory]?.items[secondaryCategory]
              ?.checked || false
          }
          onCheckedChange={handleSecondaryChange}
        />
      </div>
      <div className="ml-4 space-y-2">
        {notificationKeys.map((key) => (
          <NotificationItem
            key={key}
            primaryCategory={primaryCategory}
            secondaryCategory={secondaryCategory}
            notificationKey={key}
            notificationCheckedState={notificationCheckedState}
            submitNotificationChanges={submitNotificationChanges}
          />
        ))}
      </div>
    </div>
  );
}

interface NotificationItemProps {
  primaryCategory: string;
  secondaryCategory: string;
  notificationKey: NotificationId;
  notificationCheckedState: CheckedState;
  submitNotificationChanges: (
    notificationIds: string[],
    enabled: boolean,
  ) => void;
}

export function NotificationItem({
  primaryCategory,
  secondaryCategory,
  notificationKey,
  notificationCheckedState,
  submitNotificationChanges,
}: NotificationItemProps) {
  function handleItemChange() {
    const newItemValue =
      !notificationCheckedState[primaryCategory].items[secondaryCategory].items[
      notificationKey
      ];
    submitNotificationChanges([notificationKey], newItemValue);
  }

  return (
    <div className="text-muted-foreground flex items-center justify-between text-sm">
      <span>{notifications[notificationKey].description}</span>
      <Checkbox
        checked={
          notificationCheckedState[primaryCategory]?.items[secondaryCategory]
            ?.items[notificationKey] || false
        }
        onCheckedChange={handleItemChange}
      />
    </div>
  );
}
