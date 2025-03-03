import type { Route } from "./+types/new-route";
import { Button } from "@www/ui/button";
import { Input } from "@www/ui/input";
import { Label } from "@www/ui/label";
import {
  CardHeader,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
  Card,
} from "@www/ui/card";
import {
  requireCustomer,
  requireUserFromSession,
} from "~/utils/auth/loaders.server.js";
import { validateCustomer } from "~/utils/auth/actions.server.js";
import { TeamRepository } from "~/repositories/teams.server.js";
import { Form, Link, redirect, useNavigation } from "react-router";
import {
  sendFormValidationErrorJson,
  actionWithDefaultErrorHandling,
  validateFormData,
} from "~/utils/actions.server.js";
import { isFormValidationActionError } from "~/utils/response.js";
import { useState } from "react";
import { ErrorList } from "~/components/forms.js";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { createLoaderLogger } from "~/utils/loaders.server.js";
import { useActionErrorToast } from "~/hooks/action.js";
import { type Logger } from "~/logging/index.js";
import { customers, users } from "@acme/database/schema";
import { z } from "zod";
import { TeamService } from "~/services/team.server.js";
import { CustomerService } from "~/services/customer.server.js";
import { CustomerRepository } from "~/repositories/customers.server.js";
import { createDefaultTeamNameFromCustomerName } from "~/utils/team";

export const loader = async (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);
  await requireCustomer({ args, logger, projection: { id: customers.id } });

  const user = await requireUserFromSession({
    args,
    logger,
    projection: { name: users.name },
  });

  return { customerName: user.name };
};

export const newTeamSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Please enter a team name" })
    .regex(/[a-zA-Z]{3,}/, {
      message: "Team name must contain at least three letters",
    }),
});

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    const customer = await validateCustomer({
      args,
      logger,
      projection: { id: customers.id },
    });

    const parsed = await validateFormData({
      schema: newTeamSchema,
      request: args.request,
    });

    if (!parsed.success) {
      return sendFormValidationErrorJson(parsed);
    }

    const teamService = new TeamService({
      logger,
      teamRepo: new TeamRepository(),
    });

    const slug = await teamService.createTeam({
      ownerCustomerId: customer.id,
      name: parsed.data.name.trim(),
      customerService: new CustomerService({
        customerRepo: new CustomerRepository(),
        logger,
      }),
    });

    throw redirect(`/${slug}/`);
  },
);

export default function NewTeam({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const [name, setName] = useState(
    createDefaultTeamNameFromCustomerName(loaderData.customerName),
  );
  const navigation = useNavigation();

  useActionErrorToast(actionData);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center">
      <Card className="bg-base-200 mt w-full max-w-lg">
        <Form method="POST">
          <CardHeader>
            <CardTitle>Create your team</CardTitle>
            <CardDescription>
              You can change these settings at any point.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder=""
                  value={name}
                  onChange={handleNameChange}
                />
                {isFormValidationActionError(actionData) &&
                  actionData.formValidationError.name?._errors && (
                    <ErrorList
                      errors={actionData.formValidationError.name._errors}
                    />
                  )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link to="/teams/join">
              <Button className="text-blue-500" variant="ghost" type="button">
                I'm joining a team
              </Button>
            </Link>
            <Button loading={navigation.state !== "idle"}>Create</Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );
}
