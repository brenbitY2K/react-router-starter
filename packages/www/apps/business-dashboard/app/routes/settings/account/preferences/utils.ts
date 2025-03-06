import {
  notificationDisplayMap,
  type NotificationId,
  notifications,
} from "~/services/email/notifications.js";

function createDefaultNotificationEnabledMap(): NotificationEnabledMap {
  return Object.keys(notifications).reduce((acc, key) => {
    acc[key as NotificationId] = false;
    return acc;
  }, {} as NotificationEnabledMap);
}

export function createNotificationsEnabledMap(
  notificationSettings:
    | { notificationId: string; enabled: boolean }[]
    | undefined,
) {
  return (
    notificationSettings?.reduce((acc, setting) => {
      acc[setting.notificationId as NotificationId] = setting.enabled;
      return acc;
    }, createDefaultNotificationEnabledMap()) ??
    createDefaultNotificationEnabledMap()
  );
}

export function createInitialCheckedState(
  notificationEnabledMap: NotificationEnabledMap,
) {
  const initialCheckedState: CheckedState = {};
  Object.entries(notificationDisplayMap).forEach(
    ([primaryCategory, secondaryCategories]) => {
      initialCheckedState[primaryCategory] = { checked: true, items: {} };
      Object.entries(secondaryCategories).forEach(
        ([secondaryCategory, notificationIds]) => {
          initialCheckedState[primaryCategory].items[secondaryCategory] = {
            checked: true,
            items: {},
          };
          notificationIds.forEach((notificationId) => {
            const isEnabled = notificationEnabledMap[notificationId] ?? true; // Default to true if not found
            initialCheckedState[primaryCategory].items[secondaryCategory].items[
              notificationId
            ] = isEnabled;

            // Update parent checkbox states
            if (!isEnabled) {
              initialCheckedState[primaryCategory].items[
                secondaryCategory
              ].checked = false;
              initialCheckedState[primaryCategory].checked = false;
            }
          });
        },
      );
    },
  );

  return initialCheckedState;
}

export type NotificationEnabledMap = Record<NotificationId, boolean>;
export type CheckedState = {
  [primaryCategory: string]: {
    checked: boolean;
    items: {
      [secondaryCategory: string]: {
        checked: boolean;
        items: {
          [key: string]: boolean;
        };
      };
    };
  };
};
