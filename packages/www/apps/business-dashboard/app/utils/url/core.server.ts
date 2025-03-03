import { type Params } from "react-router";
import { type Thrower } from "~/types/errors.js";

export function getRouteParamOrThrow({
  params,
  param,
  thrower,
}: {
  param: string;
  params: Params<string>;
  thrower: Thrower;
}) {
  const paramResult = params[param];
  if (paramResult === undefined) {
    throw thrower();
  }
  return paramResult;
}
