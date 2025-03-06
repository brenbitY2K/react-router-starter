import type { MetaFunction } from "react-router";
import { redirect } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Acme" },
    { name: "description", content: "The future of land acquisition" },
  ];
};

export function loader() {
  throw redirect("/login");
}
