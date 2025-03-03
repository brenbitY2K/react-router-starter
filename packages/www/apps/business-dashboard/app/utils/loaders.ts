import { type LoaderFunction } from "react-router";

export type LoaderData<Loader extends LoaderFunction> = Awaited<
  ReturnType<Loader>
>;
