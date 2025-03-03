import {
  customerFlowTrackers,
  type customers,
  customersToTeams,
  teams,
} from "@acme/database/schema";
import {
  type CustomerQueryable,
  type CustomerRepository,
} from "~/repositories/customers.server.js";

type Customer = Pick<
  typeof customers.$inferSelect,
  "id" | "activeTeamId" | "activeTheme"
>;

export class FlowSelectorService {
  private customerQuerier: CustomerQueryable;
  private customer: Customer;

  constructor({
    customerRepo,
    customer,
  }: {
    customerRepo: CustomerRepository;
    customer: Customer;
  }) {
    this.customerQuerier = customerRepo.getQuerier();
    this.customer = customer;
  }

  async getRedirectPath() {
    const customerHasCompletedWelcomeFlow =
      await this.checkIfCustomerHasGoneThroughWelcomeFlow();

    if (!customerHasCompletedWelcomeFlow) return "/welcome";

    const teamRoute = await this.getTeamRoute();

    return teamRoute;
  }

  private async getTeamRoute() {
    const teamsResult = await this.customerQuerier.queryTeams({
      customerId: this.customer.id,
      teamProjection: { id: teams.id, slug: teams.slug },
      customerToTeamsProjection: { role: customersToTeams.role },
    });

    if (!teamsResult?.length) {
      return "/teams/new";
    }

    let activeTeamResult = teamsResult.find(
      (result) => result.customer_team.id === this.customer.activeTeamId,
    );

    if (!activeTeamResult) {
      activeTeamResult = teamsResult[0];
    }
    return `/${activeTeamResult.customer_team.slug}/`;
  }

  private async checkIfCustomerHasGoneThroughWelcomeFlow() {
    const customerFlowTracker =
      await this.customerQuerier.queryCustomerFlowTracker({
        customerId: this.customer.id,
        projection: {
          hasCompletedWelcomeFlow: customerFlowTrackers.hasCompletedWelcomeFlow,
        },
      });

    return customerFlowTracker?.hasCompletedWelcomeFlow ?? false;
  }
}
