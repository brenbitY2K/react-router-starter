import { TeamQuerier } from "~/repositories/teams.server.js";
import {
  type TeamRole,
  checkIfCustomerHasPermissionsOrThrow,
} from "./core.server.js";
import { throwUnauthorizedErrorResponseJsonAndLog } from "../response.server.js";
import { type Logger } from "~/logging/index.js";

export async function requireCustomerWithRole({
  role,
  teamId,
  customerId,
  errorMessage,
  logger,
}: {
  role: TeamRole;
  teamId: string;
  customerId: string;
  errorMessage: string;
  logger: Logger;
}) {
  const teamQuerier = new TeamQuerier();
  await checkIfCustomerHasPermissionsOrThrow({
    customerId,
    role,
    teamQuerier,
    teamId,
    thrower: () => {
      throw throwUnauthorizedErrorResponseJsonAndLog({
        data: { message: errorMessage },
        logInfo: { logger, event: "unauthorized" },
        location: "root",
      });
    },
  });
}
