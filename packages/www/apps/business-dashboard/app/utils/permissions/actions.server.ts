import {
  type TeamRole,
  checkIfCustomerHasPermissionsOrThrow,
} from "./core.server.js";
import { throwActionErrorAndLog } from "../response.server.js";
import { type Logger } from "~/logging/index.js";
import { TeamQuerier } from "~/repositories/teams.server.js";

export async function validateCustomerHasRole({
  role,
  logger,
  customerId,
  teamId,
  errorMessage,
}: {
  role: TeamRole;
  customerId: string;
  teamId: string;
  logger: Logger;
  errorMessage: string;
}) {
  const teamQuerier = new TeamQuerier();

  await checkIfCustomerHasPermissionsOrThrow({
    teamQuerier,
    customerId,
    teamId,
    role,
    thrower: () => {
      throw throwActionErrorAndLog({
        message: errorMessage,
        logInfo: { logger, event: "unauthorized" },
      });
    },
  });
}
