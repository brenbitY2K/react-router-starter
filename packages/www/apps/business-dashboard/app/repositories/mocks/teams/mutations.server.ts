import { generateMockCuid } from "../utils.js";
import { type TeamRepository } from "../../teams.server.js";
import { vi } from "vitest";

export function mockTeamRepoRemoveCustomerFromTeam({
  teamRepo,
}: {
  teamRepo: TeamRepository;
}) {
  return vi
    .spyOn(teamRepo.getMutator(), "removeCustomerFromTeam")
    .mockImplementation(() => Promise.resolve());
}

export function mockTeamRepoTeamCreate({
  teamRepo,
}: {
  teamRepo: TeamRepository;
}) {
  return vi
    .spyOn(teamRepo.getMutator(), "createTeam")
    .mockReturnValue(Promise.resolve(generateMockCuid()));
}

export function mockTeamRepoAddCustomer({
  teamRepo,
}: {
  teamRepo: TeamRepository;
}) {
  return vi
    .spyOn(teamRepo.getMutator(), "addCustomer")
    .mockImplementation(() => Promise.resolve());
}

export function mockTeamRepoUpdateCustomerRole({
  teamRepo,
}: {
  teamRepo: TeamRepository;
}) {
  return vi
    .spyOn(teamRepo.getMutator(), "updateCustomerRole")
    .mockImplementation(() => Promise.resolve());
}

export function mockTeamRepoCreateEmailInvitations({
  teamRepo,
}: {
  teamRepo: TeamRepository;
}) {
  return vi
    .spyOn(teamRepo.getMutator(), "createEmailInvitations")
    .mockImplementation(() =>
      Promise.resolve([generateMockCuid(), generateMockCuid()]),
    );
}

export function mockTeamRepoCreateShareableInvitation({
  teamRepo,
}: {
  teamRepo: TeamRepository;
}) {
  return vi
    .spyOn(teamRepo.getMutator(), "createShareableInvitation")
    .mockReturnValue(Promise.resolve(generateMockCuid()));
}

export function mockTeamRepoDeleteShareableInvitation({
  teamRepo,
}: {
  teamRepo: TeamRepository;
}) {
  return vi
    .spyOn(teamRepo.getMutator(), "deleteShareableInvitaiton")
    .mockImplementation(() => Promise.resolve());
}

export function mockTeamRepoDeleteEmailInvite({
  teamRepo,
}: {
  teamRepo: TeamRepository;
}) {
  return vi
    .spyOn(teamRepo.getMutator(), "deleteEmailInvite")
    .mockImplementation(() => Promise.resolve());
}

export function mockTeamRepoDeleteExistingEmailInvites({
  teamRepo,
}: {
  teamRepo: TeamRepository;
}) {
  return vi
    .spyOn(teamRepo.getMutator(), "deleteExistingEmailInvites")
    .mockImplementation(() => Promise.resolve());
}

export function mockTeamRepoUpdateGeneralInfo({
  teamRepo,
}: {
  teamRepo: TeamRepository;
}) {
  return vi
    .spyOn(teamRepo.getMutator(), "updateGeneralInfo")
    .mockImplementation(() => Promise.resolve());
}
