import { type Logger } from "~/logging/index.js";
import {
  type TeamMutable,
  type TeamRepository,
} from "~/repositories/teams.server.js";
import { type CustomerService } from "./customer.server.js";
import { throwActionErrorAndLog } from "~/utils/response.server.js";
import { RESERVED_PATHS } from "~/utils/reserved-paths.js";

export class TeamService {
  private logger: Logger;
  private teamMutator: TeamMutable;

  constructor({
    logger,
    teamRepo,
  }: {
    logger: Logger;
    teamRepo: TeamRepository;
  }) {
    this.logger = logger;

    this.teamMutator = teamRepo.getMutator();
  }

  async createTeam({
    ownerCustomerId,
    name,
    customerService,
  }: {
    name: string;
    ownerCustomerId: string;
    customerService: CustomerService;
  }) {
    const baseSlug = name
      .trim()
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");

    if (baseSlug === "" || !isValidTeamSlug(baseSlug)) {
      throw throwActionErrorAndLog({
        message: "This team name is not allowed.",
        logInfo: {
          logger: this.logger,
          event: "team_slug_conflicts_with_app_route",
          data: { slug: baseSlug },
        },
      });
    }

    let slug = baseSlug;
    let counter = 1;
    let teamId: string;

    while (true) {
      try {
        teamId = await this.teamMutator.createTeam({
          slug,
          name: name.trim(),
        });
        break;
      } catch (error) {
        if (error instanceof Error && error.name === "PostgresError") {
          slug = `${baseSlug}-${counter}`;
          counter++;
          continue;
        }
        throw error;
      }
    }

    await this.teamMutator.addCustomer({
      teamId,
      customerId: ownerCustomerId,
      role: "owner",
    });

    await customerService.createTeamNotificationSettingsRows({
      customerId: ownerCustomerId,
      teamId,
    });

    return slug;
  }

  async updateGeneralInfo({
    teamId,
    name,
    slug,
    imageUrl,
  }: {
    name?: string;
    slug?: string;
    imageUrl?: string;
    teamId: string;
  }) {
    if (slug) {
      if (!isValidTeamSlug(slug)) {
        throw throwActionErrorAndLog({
          message: "This team name is not allowed.",
          logInfo: {
            logger: this.logger,
            event: "team_slug_conflicts_with_app_route",
            data: { slug },
          },
        });
      }
    }

    await this.teamMutator.updateGeneralInfo({
      teamId,
      data: {
        name: name !== undefined ? name.trim() : undefined,
        slug,
        imageUrl,
      },
    });
  }
}

export function isValidTeamSlug(slug: string) {
  return !RESERVED_PATHS.some((path) => slug === path.toLowerCase());
}
