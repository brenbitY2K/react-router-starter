import { type ActionFunctionArgs } from "react-router";
import { type Logger } from "~/logging/index.js";
import {
  actionWithDefaultErrorHandling,
  getActionIntent,
} from "~/utils/actions.server.js";
import { changeSession } from "./actions/change-session.js";
import { FormLayoutIntent } from "./intents.js";

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    const intent = await getActionIntent(args.request);
    if (intent === FormLayoutIntent.CHANGE_SESSION)
      return await changeSession(args, logger);
  },
);
