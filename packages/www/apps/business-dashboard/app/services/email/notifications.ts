export const notifications = {
  "example-notification-one": {
    role: "member",
    description: "Example notification one",
  },
  "example-notification-two": {
    role: "member",
    description: "Example notification two",
  },
  "example-notification-three": {
    role: "member",
    description: "Example notification three",
  },
  "example-notification-four": {
    role: "member",
    description: "Example notification four",
  },
  "example-notification-five": {
    role: "member",
    description: "Example notification five",
  },
  "example-notification-six": {
    role: "member",
    description: "Example notification six",
  },
  "example-notification-seven": {
    role: "member",
    description: "Example notification seven",
  },
  "example-notification-eight": {
    role: "member",
    description: "Example notification eight",
  },
  "example-notification-nine": {
    role: "member",
    description: "Example notification nine",
  },
  "example-notification-ten": {
    role: "member",
    description: "Example notification ten",
  },
} as const;

export const notificationDisplayMap: DisplayedNotifications = {
  "Primary category one": {
    direct: ["example-notification-nine", "example-notification-ten"],
    "Secondary category one": [
      "example-notification-one",
      "example-notification-two",
    ],
    "Secondary category two": [
      "example-notification-three",
      "example-notification-four",
    ],
  },
  "Primary category two": {
    "Secondary category three": [
      "example-notification-five",
      "example-notification-six",
      "example-notification-seven",
    ],
  },
  "Primary category three": {
    "Secondary category four": ["example-notification-eight"],
  },
};

type DisplayedNotifications = {
  [primaryCategory: string]: {
    [secondaryCategory: string]: NotificationId[];
  };
};
export type NotificationId = keyof typeof notifications;
