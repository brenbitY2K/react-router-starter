import type { Route } from "./+types/role-selection-route";
import { Button } from "@www/ui/button";
import { Label } from "@www/ui/label";
import {
  requireCustomer,
  requireUserFromSession,
} from "~/utils/auth/loaders.server.js";
import { Form, redirect, useNavigation } from "react-router";
import {
  actionWithDefaultErrorHandling,
  getActionIntent,
} from "~/utils/actions.server.js";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { createLoaderLogger } from "~/utils/loaders.server.js";
import { useActionErrorToast } from "~/hooks/action.js";
import { type Logger } from "~/logging/index.js";
import {
  customerFlowTrackers,
  customers,
  users,
} from "@acme/database/schema";
import { CardContent, CardTitle, CardDescription, Card } from "@www/ui/card";
import { useGA4PageView } from "~/hooks/analytics-tracking";
import {
  Building,
  Building2,
  CircleDollarSign,
  HardHat,
  HelpCircle,
  Home,
  Landmark,
  Scale,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@www/ui/radio-group";
import { useState } from "react";
import { selectRole } from "./actions/select-role";
import { isFormValidationActionError } from "~/utils/response";
import { ErrorList } from "~/components/forms";
import { CustomerQuerier } from "~/repositories/customers.server";
import { trackCompletedWelcomeFlow } from "~/utils/analytics/core";

export const loader = async (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);
  const customer = await requireCustomer({
    args,
    logger,
    projection: { id: customers.id, activeTeamId: customers.activeTeamId },
  });

  const customerQuerier = new CustomerQuerier();

  const queryResult = await customerQuerier.queryCustomerFlowTracker({
    customerId: customer.id,
    projection: {
      hasCompletedWelcomeFlow: customerFlowTrackers.hasCompletedWelcomeFlow,
    },
  });

  if (queryResult?.hasCompletedWelcomeFlow)
    throw redirect("/map/demo/create-team");

  const user = await requireUserFromSession({
    args,
    logger,
    projection: { name: users.name, id: users.id, email: users.email },
  });

  return { customerName: user.name, userId: user.id, email: user.email };
};

export enum RoleSelectionRouteIntent {
  SELECT_ROLE = "role_selection_dialog_route_select_role",
}

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    const intent = await getActionIntent(args.request);
    if (intent === RoleSelectionRouteIntent.SELECT_ROLE)
      return await selectRole(args, logger);
  },
);

const jobTypes = [
  {
    type: "Contractor",
    icon: HardHat,
    value: "contractor",
  },
  {
    type: "Appraiser",
    icon: Scale,
    value: "appraiser",
  },
  {
    type: "Lender",
    icon: CircleDollarSign,
    value: "lender",
  },
  {
    type: "Developer",
    icon: Building2,
    value: "developer",
  },
  {
    type: "Investor",
    icon: Building,
    value: "investor",
  },
  {
    type: "Builder",
    icon: Home,
    value: "builder",
  },
  {
    type: "Government",
    icon: Landmark,
    value: "government",
  },
  {
    type: "Other",
    icon: HelpCircle,
    value: "other",
  },
];

export default function RoleSelectionRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [selectedValue, setSelectedValue] = useState("");

  useGA4PageView();
  useActionErrorToast(actionData);

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.currentTarget);
    const jobRole = formData.get("jobType") as string | null;

    if (jobRole) {
      trackCompletedWelcomeFlow({
        userId: loaderData.userId,
        email: loaderData.email,
        jobRole,
      });
    }
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <Card className="max-w-lg pt-6">
        <CardContent>
          <CardTitle>What best describes your role?</CardTitle>
          <CardDescription>
            Help us tailor your experience by selecting your primary business
            function.
          </CardDescription>
          <Form method="post" className="space-y-6" onSubmit={handleFormSubmit}>
            <input
              type="hidden"
              name="intent"
              value={RoleSelectionRouteIntent.SELECT_ROLE}
            />
            <RadioGroup
              name="jobType"
              className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
              required
              onValueChange={setSelectedValue}
              value={selectedValue}
            >
              {jobTypes.map(({ type, icon: Icon, value }) => (
                <div key={value} className="relative">
                  <RadioGroupItem
                    value={value}
                    id={value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={value}
                    className="peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 border-border hover:border-border/80 hover:bg-muted flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-all"
                  >
                    <Icon className="peer-data-[state=checked]:text-primary h-6 w-6 text-gray-600" />
                    <span>{type}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {isFormValidationActionError(actionData) &&
              actionData.formValidationError.jobType?._errors && (
                <ErrorList
                  errors={actionData.formValidationError.jobType._errors}
                />
              )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !selectedValue}
            >
              Continue
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
