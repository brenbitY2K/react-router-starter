import { type UserRepository } from "../../users.server.js";
import { vi } from "vitest";
import {
  mockedUserFullSelect,
  mockedTeamsForCustomerUserIds,
  mockedCustomersByUserIds,
} from "./data.server.js";
import { mockedOAuthAccountFullSelect } from "../oauth-accounts/data.server.js";
import { type DeepPartial, mergeDeep } from "../utils.js";

export function mockUserRepoQueryUser({
  userRepo,
  data,
}: {
  userRepo: UserRepository;
  data?: DeepPartial<ReturnType<typeof mockedUserFullSelect>>;
}) {
  return vi
    .spyOn(userRepo.getQuerier(), "queryUser")
    .mockImplementation(({ userId }: { userId: string }) => {
      const mockData = mockedUserFullSelect();
      const mergedData = mergeDeep({ ...mockData, id: userId }, data || {});
      return Promise.resolve(mergedData);
    });
}

export function mockUserRepoQueryUserUndefined({
  userRepo,
}: {
  userRepo: UserRepository;
}) {
  return vi
    .spyOn(userRepo.getQuerier(), "queryUser")
    .mockResolvedValue(undefined);
}

export function mockUserRepoQueryUserWithEmail({
  userRepo,
  data,
}: {
  userRepo: UserRepository;
  data?: DeepPartial<ReturnType<typeof mockedUserFullSelect>>;
}) {
  return vi
    .spyOn(userRepo.getQuerier(), "queryUserWithEmail")
    .mockImplementation(({ email }: { email: string }) => {
      const mockData = mockedUserFullSelect();
      const mergedData = mergeDeep({ ...mockData, email }, data || {});
      return Promise.resolve(mergedData);
    });
}

export function mockUserRepoQueryUserWithEmailUndefined({
  userRepo,
}: {
  userRepo: UserRepository;
}) {
  return vi
    .spyOn(userRepo.getQuerier(), "queryUserWithEmail")
    .mockResolvedValue(undefined);
}

export function mockUserRepoQueryOAuthAccounts({
  userRepo,
  data,
}: {
  userRepo: UserRepository;
  data?: DeepPartial<ReturnType<typeof mockedOAuthAccountFullSelect>>[] | null;
}) {
  return vi
    .spyOn(userRepo.getQuerier(), "queryOAuthAccounts")
    .mockImplementation(({ userId }: { userId: string }) => {
      if (data === undefined) {
        const defaultAccounts = [mockedOAuthAccountFullSelect()];
        return Promise.resolve(
          defaultAccounts.map((account) => ({ ...account, userId })),
        );
      }

      if (data === null || data.length === 0) {
        return Promise.resolve([]);
      }

      const defaultAccounts = Array.from({ length: data.length }, () =>
        mockedOAuthAccountFullSelect(),
      );
      const mergedData = data.map((item, index) => {
        if (item) {
          return mergeDeep({ ...defaultAccounts[index], userId }, item);
        }
        return { ...defaultAccounts[index], userId };
      });

      return Promise.resolve(mergedData);
    });
}

export function mockUserRepoQueryOAuthAccountsEmpty({
  userRepo,
}: {
  userRepo: UserRepository;
}) {
  return vi
    .spyOn(userRepo.getQuerier(), "queryOAuthAccounts")
    .mockResolvedValue([]);
}

export function mockUserRepoQueryTeamsForCustomerUserIds({
  userRepo,
  data,
}: {
  userRepo: UserRepository;
  data?:
    | DeepPartial<ReturnType<typeof mockedTeamsForCustomerUserIds>[number]>[]
    | null;
}) {
  return vi
    .spyOn(userRepo.getQuerier(), "queryTeamsForCustomerUserIds")
    .mockImplementation(() => {
      if (data === undefined) {
        return Promise.resolve(mockedTeamsForCustomerUserIds());
      }

      if (data === null || data.length === 0) {
        return Promise.resolve([]);
      }

      const defaultData = mockedTeamsForCustomerUserIds(data.length);
      const mergedData = data.map((item, index) => {
        if (item) {
          return mergeDeep(defaultData[index], item);
        }
        return defaultData[index];
      });

      return Promise.resolve(mergedData);
    });
}

export function mockUserRepoQueryTeamsForCustomerUserIdsEmpty({
  userRepo,
}: {
  userRepo: UserRepository;
}) {
  return vi
    .spyOn(userRepo.getQuerier(), "queryTeamsForCustomerUserIds")
    .mockResolvedValue([]);
}

export function mockUserRepoQueryCustomersByUserIds({
  userRepo,
  data,
}: {
  userRepo: UserRepository;
  data?:
    | DeepPartial<ReturnType<typeof mockedCustomersByUserIds>[number]>[]
    | null;
}) {
  return vi
    .spyOn(userRepo.getQuerier(), "queryCustomersByUserIds")
    .mockImplementation(({ userIds }) => {
      if (data === undefined) {
        return Promise.resolve(mockedCustomersByUserIds(userIds.length));
      }

      if (data === null || data.length === 0) {
        return Promise.resolve([]);
      }

      const defaultData = mockedCustomersByUserIds(data.length);
      const mergedData = data.map((item, index) => {
        if (item) {
          return mergeDeep(defaultData[index], item);
        }
        return defaultData[index];
      });

      return Promise.resolve(mergedData);
    });
}

export function mockUserRepoQueryCustomersByUserIdsEmpty({
  userRepo,
}: {
  userRepo: UserRepository;
}) {
  return vi
    .spyOn(userRepo.getQuerier(), "queryCustomersByUserIds")
    .mockResolvedValue([]);
}
