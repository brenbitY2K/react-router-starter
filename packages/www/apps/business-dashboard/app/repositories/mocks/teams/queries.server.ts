import { type TeamRepository } from "../../teams.server.js";
import { vi } from "vitest";
import {
  mockedCustomerToTeamRelationFullSelect,
  mockedTeamFullSelect,
  mockedTeamEmailInviteFullSelect,
  mockedMultipleEmailInvites,
} from "./data.server.js";
import { mockedCustomerFullSelect } from "../customers/data.server.js";
import { type DeepPartial, mergeDeep } from "../utils.js";

export function mockTeamRepoQueryCustomerToTeamRelation({
  teamRepo,
  data,
}: {
  teamRepo: TeamRepository;
  data?: DeepPartial<ReturnType<typeof mockedCustomerToTeamRelationFullSelect>>;
}) {
  return vi
    .spyOn(teamRepo.getQuerier(), "queryCustomerToTeamRelation")
    .mockImplementation(
      ({ customerId, teamId }: { customerId: string; teamId: string }) => {
        const mockData = mockedCustomerToTeamRelationFullSelect();
        const mergedData = mergeDeep(
          { ...mockData, customerId, teamId },
          data || {},
        );
        return Promise.resolve(mergedData);
      },
    );
}

export function mockTeamRepoQueryCustomerToTeamRelationUndefined({
  teamRepo,
}: {
  teamRepo: TeamRepository;
}) {
  return vi
    .spyOn(teamRepo.getQuerier(), "queryCustomerToTeamRelation")
    .mockResolvedValue(undefined);
}

export function mockTeamRepoQueryTeam({
  teamRepo,
  data,
}: {
  teamRepo: TeamRepository;
  data?: DeepPartial<ReturnType<typeof mockedTeamFullSelect>>;
}) {
  return vi
    .spyOn(teamRepo.getQuerier(), "queryTeam")
    .mockImplementation(({ teamId }: { teamId: string }) => {
      const mockData = mockedTeamFullSelect();
      const mergedData = mergeDeep({ ...mockData, id: teamId }, data || {});
      return Promise.resolve(mergedData);
    });
}

export function mockTeamRepoQueryTeamUndefined({
  teamRepo,
}: {
  teamRepo: TeamRepository;
}) {
  return vi
    .spyOn(teamRepo.getQuerier(), "queryTeam")
    .mockResolvedValue(undefined);
}

export function mockTeamRepoQueryTeamWithSlug({
  teamRepo,
  data,
}: {
  teamRepo: TeamRepository;
  data?: DeepPartial<ReturnType<typeof mockedTeamFullSelect>>;
}) {
  return vi
    .spyOn(teamRepo.getQuerier(), "queryTeamWithSlug")
    .mockImplementation(({ slug }: { slug: string }) => {
      const mockData = mockedTeamFullSelect();
      const mergedData = mergeDeep({ ...mockData, slug }, data || {});
      return Promise.resolve(mergedData);
    });
}

export function mockTeamRepoQueryTeamWithSlugUndefined({
  teamRepo,
}: {
  teamRepo: TeamRepository;
}) {
  return vi
    .spyOn(teamRepo.getQuerier(), "queryTeamWithSlug")
    .mockResolvedValue(undefined);
}

export function mockTeamRepoQueryCustomers({
  teamRepo,
  data,
}: {
  teamRepo: TeamRepository;
  data?:
    | DeepPartial<{
        customer_to_customer_teams: ReturnType<
          typeof mockedCustomerToTeamRelationFullSelect
        >;
        customer: ReturnType<typeof mockedCustomerFullSelect>;
      }>[]
    | null;
}) {
  return vi
    .spyOn(teamRepo.getQuerier(), "queryCustomers")
    .mockImplementation(({ teamId }: { teamId: string }) => {
      if (data === undefined) {
        const defaultData = [
          {
            customer_to_customer_teams: {
              ...mockedCustomerToTeamRelationFullSelect(),
              teamId,
            },
            customer: mockedCustomerFullSelect(),
          },
        ];
        return Promise.resolve(defaultData);
      }

      if (data === null || data.length === 0) {
        return Promise.resolve([]);
      }

      const mergedData = data.map((item) => {
        const defaultItem = {
          customer_to_customer_teams: {
            ...mockedCustomerToTeamRelationFullSelect(),
            teamId,
          },
          customer: mockedCustomerFullSelect(),
        };
        return mergeDeep(defaultItem, item);
      });

      return Promise.resolve(mergedData);
    });
}

export function mockTeamRepoQueryCustomersUndefined({
  teamRepo,
}: {
  teamRepo: TeamRepository;
}) {
  return vi
    .spyOn(teamRepo.getQuerier(), "queryCustomers")
    .mockResolvedValue(undefined);
}

export function mockTeamRepoQueryEmailInvite({
  teamRepo,
  data,
}: {
  teamRepo: TeamRepository;
  data?: DeepPartial<ReturnType<typeof mockedTeamEmailInviteFullSelect>>;
}) {
  return vi
    .spyOn(teamRepo.getQuerier(), "queryEmailInvite")
    .mockImplementation(
      ({ code, teamId }: { code: string; teamId: string }) => {
        const mockData = mockedTeamEmailInviteFullSelect();
        const mergedData = mergeDeep({ ...mockData, code, teamId }, data || {});
        return Promise.resolve(mergedData);
      },
    );
}

export function mockTeamRepoQueryEmailInviteUndefined({
  teamRepo,
}: {
  teamRepo: TeamRepository;
}) {
  return vi
    .spyOn(teamRepo.getQuerier(), "queryEmailInvite")
    .mockResolvedValue(undefined);
}

export function mockTeamRepoQueryEmailInvites({
  teamRepo,
  data,
}: {
  teamRepo: TeamRepository;
  data?:
    | DeepPartial<ReturnType<typeof mockedTeamEmailInviteFullSelect>>[]
    | null;
}) {
  return vi
    .spyOn(teamRepo.getQuerier(), "queryEmailInvites")
    .mockImplementation(() => {
      if (data === undefined) {
        return Promise.resolve(mockedMultipleEmailInvites());
      }

      if (data === null || data.length === 0) {
        return Promise.resolve([]);
      }

      const defaultData = mockedMultipleEmailInvites(data.length);
      const mergedData = data.map((item, index) =>
        mergeDeep(defaultData[index], item || {}),
      );

      return Promise.resolve(mergedData);
    });
}

export function mockTeamRepoQueryEmailInvitesUndefined({
  teamRepo,
}: {
  teamRepo: TeamRepository;
}) {
  return vi
    .spyOn(teamRepo.getQuerier(), "queryEmailInvites")
    .mockResolvedValue(undefined);
}
