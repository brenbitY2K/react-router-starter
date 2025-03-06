import { type OAuthAccountRepository } from "../../oauth-accounts.server.js";
import { vi } from "vitest";

export function mockOAuthAccountRepoCreateOAuthAccount({
  oauthAccountRepo,
}: {
  oauthAccountRepo: OAuthAccountRepository;
}) {
  return vi
    .spyOn(oauthAccountRepo.getMutator(), "createOAuthAccount")
    .mockImplementation(() => Promise.resolve());
}
