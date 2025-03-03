import {
  type ActionFunction,
  type ActionFunctionArgs,
  data,
} from "react-router";
import { type z } from "zod";
import {
  type Logger,
  logErrorEvent,
  loggerWithActionInfo,
} from "~/logging/index.js";
import { ActionError } from "~/utils/response.js";
import { logger as baseLogger } from "~/lib/pino.server.js";

export function sendActionErrorJson(actionError: ActionError) {
  return data({
    error: {
      message: actionError.message,
      timestamp: actionError.timestamp,
    },
  });
}

type SafeParseErrorType<T> = z.SafeParseError<T>;

type ZodErrorFormat<T> = {
  formValidationError: z.ZodFormattedError<T, string>;
};

export function sendFormValidationErrorJson<T>(
  parsed: SafeParseErrorType<T>,
): ZodErrorFormat<T> {
  return {
    formValidationError: parsed.error.format(),
  };
}

export function sendUnknownErrorJson() {
  return {
    error: {
      message: "An unknown error occured. Please try again later.",
      timestamp: Date.now(),
    },
  };
}

type ValidateFormDataParams<T extends z.ZodObject<any>> = {
  schema: T;
  request?: Request;
  formData?: FormData;
};

// Overload signatures
export async function validateFormData<T extends z.ZodObject<any>>(params: {
  schema: T;
  request: Request;
}): Promise<z.SafeParseReturnType<z.infer<T>, z.infer<T>>>;
export async function validateFormData<T extends z.ZodObject<any>>(params: {
  schema: T;
  formData: FormData;
}): Promise<z.SafeParseReturnType<z.infer<T>, z.infer<T>>>;

// Implementation
export async function validateFormData<T extends z.ZodObject<any>>({
  schema,
  request,
  formData: providedFormData,
}: ValidateFormDataParams<T>): Promise<
  z.SafeParseReturnType<z.infer<T>, z.infer<T>>
> {
  let formData: FormData;
  if (request) {
    formData = await request.formData();
  } else if (providedFormData) {
    formData = providedFormData;
  } else {
    throw new Error("Either request or formData must be provided");
  }

  const formDataObj: Record<string, any> = {};
  for (const [key, value] of formData.entries()) {
    if (key.endsWith("[]")) {
      const arrayKey = key.slice(0, -2);
      if (!formDataObj[arrayKey]) {
        formDataObj[arrayKey] = [];
      }
      formDataObj[arrayKey].push(value);
    } else {
      formDataObj[key] = value;
    }
  }

  const parsed = schema.safeParse(formDataObj);
  return parsed;
}

type ActionFunctionReturnType = ReturnType<ActionFunction>;

type DefaultErrorHandlingReturnType =
  | ReturnType<typeof sendActionErrorJson>
  | ReturnType<typeof sendUnknownErrorJson>;

type CombinedReturnType<T extends ActionFunctionWithLogger> =
  | Awaited<ReturnType<T>>
  | DefaultErrorHandlingReturnType;

export type ActionFunctionWithLogger = (
  args: ActionFunctionArgs,
  logger: Logger,
) => ActionFunctionReturnType;

export function actionWithDefaultErrorHandling<
  T extends ActionFunctionWithLogger,
>(action: T): (args: ActionFunctionArgs) => Promise<CombinedReturnType<T>> {
  return async function (
    args: ActionFunctionArgs,
  ): Promise<CombinedReturnType<T>> {
    const logger = createActionLogger(args);
    try {
      return (await action(args, logger)) as CombinedReturnType<T>;
    } catch (error) {
      if (error instanceof ActionError) {
        return sendActionErrorJson(error) as DefaultErrorHandlingReturnType;
      }

      if (error instanceof Error) {
        logErrorEvent(logger, "unknown", error);
        return sendUnknownErrorJson() as DefaultErrorHandlingReturnType;
      }

      throw error;
    }
  };
}

export function createActionLogger(args: ActionFunctionArgs) {
  return loggerWithActionInfo(baseLogger, args);
}

export async function getActionIntent(
  request: Request,
): Promise<string | null> {
  let actionName = findNameInURL(new URL(request.url).searchParams);
  if (actionName) return actionName;
  return findNameInFormData(await request.clone().formData());
}

function findNameInURL(searchParams: URLSearchParams) {
  for (let key of searchParams.keys()) {
    if (key.startsWith("/")) return key.slice(1);
  }

  let actionName = searchParams.get("intent");
  if (typeof actionName === "string") return actionName;

  actionName = searchParams.get("action");
  if (typeof actionName === "string") return actionName;

  actionName = searchParams.get("_action");
  if (typeof actionName === "string") return actionName;

  return null;
}

function findNameInFormData(formData: FormData) {
  for (let key of formData.keys()) {
    if (key.startsWith("/")) return key.slice(1);
  }

  let actionName = formData.get("intent");
  if (typeof actionName === "string") return actionName;

  actionName = formData.get("action");
  if (typeof actionName === "string") return actionName;

  actionName = formData.get("_action");
  if (typeof actionName === "string") return actionName;

  return null;
}
