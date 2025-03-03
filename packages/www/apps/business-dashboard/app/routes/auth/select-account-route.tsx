import type { Route } from "./+types/select-account-route";
import { Avatar, AvatarFallback, AvatarImage } from "@www/ui/avatar";
import { Button } from "@www/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@www/ui/card";
import { Form, Link, useNavigation } from "react-router";
import {
  type ActionFunctionArgs,
  data,
  type LoaderFunctionArgs,
  redirect,
} from "react-router";
import { ArrowRightIcon } from "lucide-react";
import { z } from "zod";
import { type Logger } from "~/logging/index.js";
import { SessionRepository } from "~/repositories/sessions.server.js";
import { UserQuerier } from "~/repositories/users.server.js";
import {
  currentUserSessionStorage,
  getAuthSessionStorageWithUserId,
} from "~/sessions/auth.server.js";
import {
  actionWithDefaultErrorHandling,
  validateFormData,
} from "~/utils/actions.server.js";
import { getAllSessionsAndInvalidateStaleOnes } from "~/utils/auth/core.server.js";
import { generateImageFallbackText } from "~/utils/images.js";
import { throwActionErrorAndLog } from "~/utils/response.server.js";
import {
  createNewAuthSessionAndSetActiveUser,
  getClientInformationForSession,
} from "~/utils/sessions.server.js";

export const loader = async (args: LoaderFunctionArgs) => {
  const { users, setCookieHeaders } =
    await getAllSessionsAndInvalidateStaleOnes({
      sessionRepo: new SessionRepository(),
      cookieHeader: args.request.headers.get("Cookie"),
      userQuerier: new UserQuerier(),
    });

  if (users.length === 0) {
    throw redirect("/login", { headers: [...setCookieHeaders] });
  }

  return data({ users }, { headers: [...setCookieHeaders] });
};

export const selectAccountSchema = z.object({
  userId: z.string().min(1, "Please select an account"),
});

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    const parsed = await validateFormData({
      request: args.request,
      schema: selectAccountSchema,
    });

    if (!parsed.success) {
      throw throwActionErrorAndLog({
        message: "Please select a valid account.",
        logInfo: { logger, event: "form_validation_action_error" },
      });
    }

    const authSessionStorage = getAuthSessionStorageWithUserId({
      userId: parsed.data.userId,
      sessionRepo: new SessionRepository(),
    });
    const clientInfo = await getClientInformationForSession({
      request: args.request,
      logger,
    });
    const { authSession, currentUserSession } =
      await createNewAuthSessionAndSetActiveUser({
        authSessionStorage,
        data: { userId: parsed.data.userId, ...clientInfo },
        cookieHeader: args.request.headers.get("Cookie"),
      });

    throw redirect("/flow-selector", {
      headers: [
        ["Set-Cookie", await authSessionStorage.commitSession(authSession)],
        [
          "Set-Cookie",
          await currentUserSessionStorage.commitSession(currentUserSession),
        ],
      ],
    });
  },
);

export default function SelectAccount({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  return (
    <div className="bg-base-100 flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Select Your Account</CardTitle>
          <CardDescription>
            Your current session has expired. Please choose a different account
            or add an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {loaderData.users.map((user) => (
              <Form key={user.id} className="w-full" method="POST">
                <input type="hidden" value={user.id} name="userId" />
                <button
                  className="bg-muted hover:bg-muted/50 flex w-full cursor-pointer items-center justify-between rounded-md px-4 py-3 transition-colors"
                  type="submit"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="TODO" />
                      <AvatarFallback>
                        {generateImageFallbackText(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-muted-foreground text-sm">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    type="submit"
                    loading={
                      navigation.formData?.get("userId") === user.id &&
                      navigation.state !== "idle"
                    }
                  >
                    <ArrowRightIcon className="h-5 w-5" />
                  </Button>
                </button>
              </Form>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Link to="/login">
            <Button variant="outline">Add Another Account</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
