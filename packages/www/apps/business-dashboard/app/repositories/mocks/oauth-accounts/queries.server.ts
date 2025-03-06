import { type OAuthAccountRepository } from "../../oauth-accounts.server.js";
import { vi } from "vitest";
import {
  mockedOAuthAccountFullSelect,
  mockedMultipleOAuthAccounts,
} from "./data.server.js";
import { type DeepPartial, mergeDeep } from "../utils.js";

export function mockOAuthAccountRepoQueryOAuthAccount({
  oauthAccountRepo,
  data,
}: {
  oauthAccountRepo: OAuthAccountRepository;
  data?: DeepPartial<ReturnType<typeof mockedOAuthAccountFullSelect>>;
}) {
  return vi
    .spyOn(oauthAccountRepo.getQuerier(), "queryOAuthAccount")
    .mockImplementation(
      ({
        providerId,
        providerUserId,
      }: {
        providerId: string;
        providerUserId: string;
      }) => {
        const mockData = mockedOAuthAccountFullSelect();
        const mergedData = mergeDeep(
          { ...mockData, providerId, providerUserId },
          data || {},
        );
        return Promise.resolve(mergedData);
      },
    );
}

export function mockOAuthAccountRepoQueryOAuthAccountUndefined({
  oauthAccountRepo,
}: {
  oauthAccountRepo: OAuthAccountRepository;
}) {
  return vi
    .spyOn(oauthAccountRepo.getQuerier(), "queryOAuthAccount")
    .mockResolvedValue(undefined);
}

export function mockOAuthAccountRepoQueryOAuthAccountsByUserId({
  oauthAccountRepo,
  data,
}: {
  oauthAccountRepo: OAuthAccountRepository;
  data?: DeepPartial<ReturnType<typeof mockedOAuthAccountFullSelect>>[] | null;
}) {
  return vi
    .spyOn(oauthAccountRepo.getQuerier(), "queryOAuthAccountsByUserId")
    .mockImplementation(({ userId }: { userId: string }) => {
      if (data === undefined) {
        const defaultAccounts = mockedMultipleOAuthAccounts();
        return Promise.resolve(
          defaultAccounts.map((account) => ({ ...account, userId })),
        );
      }

      if (data === null || data.length === 0) {
        return Promise.resolve([]);
      }

      const defaultAccounts = mockedMultipleOAuthAccounts(data.length);
      const mergedData = data.map((item, index) => {
        if (item) {
          return mergeDeep({ ...defaultAccounts[index], userId }, item);
        }
        return { ...defaultAccounts[index], userId };
      });

      return Promise.resolve(mergedData);
    });
}

export function mockOAuthAccountRepoQueryOAuthAccountsByUserIdUndefined({
  oauthAccountRepo,
}: {
  oauthAccountRepo: OAuthAccountRepository;
}) {
  return vi
    .spyOn(oauthAccountRepo.getQuerier(), "queryOAuthAccountsByUserId")
    .mockResolvedValue(undefined);
}
