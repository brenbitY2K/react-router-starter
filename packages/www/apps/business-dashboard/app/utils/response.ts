import { type z } from "zod";

const errorResponseTypes = [
  "unauthenticated",
  "unauthorized",
  "not_found",
] as const;
export type ErrorResponseType = (typeof errorResponseTypes)[number];
export type ErrorResponseLocation = "root" | "local";

export type ErrorResponse<Data extends ErrorResponseData> = {
  status: number;
  statusText: string;
  data: Data;
};

export type ErrorResponseData = {
  message: string;
  location: ErrorResponseLocation;
  type: ErrorResponseType;
};

export type UnauthenticatedErrorResponseData = ErrorResponseData & {
  type: "unauthenticated";
};

export type UnauthorizedErrorResponseData = ErrorResponseData & {
  type: "unauthorized";
};

export type NotFoundErrorResponseData = ErrorResponseData & {
  type: "not_found";
};

export function isUnauthenticatedErrorResponse(
  error: ErrorResponse<ErrorResponseData>,
): error is ErrorResponse<UnauthenticatedErrorResponseData> {
  return error.data.type === "unauthenticated";
}

export function isUnauthorizedErrorResponse(
  error: ErrorResponse<ErrorResponseData>,
): error is ErrorResponse<UnauthorizedErrorResponseData> {
  return error.data.type === "unauthorized";
}

export function isNotFoundErrorResponse(
  error: ErrorResponse<ErrorResponseData>,
): error is ErrorResponse<UnauthorizedErrorResponseData> {
  return error.data.type === "not_found";
}

export function isRootRouteErrorResponse(error: any): boolean {
  return (
    error != null &&
    error?.data?.location != null &&
    error.data.location === "root"
  );
}

export type JsonifyObject<T> = {
  [P in keyof T]: T[P] extends object ? JsonifyObject<T[P]> : T[P];
};

export type FormValidationActionErrorResponse<T> = {
  formValidationError: z.ZodFormattedError<T, string>;
};

export type ActionErrorResponse = {
  error: {
    timestamp: number;
    message: string;
  };
};
export function isActionError(
  data: any,
): data is JsonifyObject<ActionErrorResponse> {
  return data && "error" in data;
}

export class ActionError extends Error {
  timestamp: number;
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
    this.timestamp = Date.now();

    Object.setPrototypeOf(this, ActionError.prototype);
  }
}

export function isFormValidationActionError<T>(
  data: any,
): data is JsonifyObject<FormValidationActionErrorResponse<T>> {
  return data && "formValidationError" in data;
}

export function isSuccessResponse(data: any): data is { success: boolean } {
  return data && "success" in data;
}
