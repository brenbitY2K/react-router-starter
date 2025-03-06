import { type UserRepository } from "../../users.server.js";
import { vi } from "vitest";
import { generateMockCuid } from "../utils.js";

export function mockUserRepoCreateUser({
  userRepo,
}: {
  userRepo: UserRepository;
}) {
  return vi
    .spyOn(userRepo.getMutator(), "createUser")
    .mockReturnValue(Promise.resolve(generateMockCuid()));
}

export function mockUserRepoUpdateEmail({
  userRepo,
}: {
  userRepo: UserRepository;
}) {
  return vi
    .spyOn(userRepo.getMutator(), "updateEmail")
    .mockImplementation(() => Promise.resolve());
}

export function mockUserRepoUpdateCoreProfileInfo({
  userRepo,
}: {
  userRepo: UserRepository;
}) {
  return vi
    .spyOn(userRepo.getMutator(), "updateCoreProfileInfo")
    .mockImplementation(() => Promise.resolve());
}

export function mockUserRepoDeleteOAuthAccount({
  userRepo,
}: {
  userRepo: UserRepository;
}) {
  return vi
    .spyOn(userRepo.getMutator(), "deleteOAuthAccount")
    .mockImplementation(() => Promise.resolve());
}
