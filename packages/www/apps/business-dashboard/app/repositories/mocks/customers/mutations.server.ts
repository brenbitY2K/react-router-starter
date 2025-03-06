import { type CustomerRepository } from "../../customers.server.js";
import { vi } from "vitest";
import { generateMockCuid } from "../utils.js";

export function mockCustomerRepoCreateCustomer({
  customerRepo,
}: {
  customerRepo: CustomerRepository;
}) {
  return vi
    .spyOn(customerRepo.getMutator(), "createCustomer")
    .mockReturnValue(Promise.resolve(generateMockCuid()));
}

export function mockCustomerRepoUpdateThemePreference({
  customerRepo,
}: {
  customerRepo: CustomerRepository;
}) {
  return vi
    .spyOn(customerRepo.getMutator(), "updateThemePreference")
    .mockImplementation(() => Promise.resolve());
}

export function mockCustomerRepoUpdateFlowTracker({
  customerRepo,
}: {
  customerRepo: CustomerRepository;
}) {
  return vi
    .spyOn(customerRepo.getMutator(), "updateFlowTracker")
    .mockImplementation(() => Promise.resolve());
}

export function mockCustomerRepoToggleTeamNotificationSettings({
  customerRepo,
}: {
  customerRepo: CustomerRepository;
}) {
  return vi
    .spyOn(customerRepo.getMutator(), "toggleTeamNotificationSettings")
    .mockImplementation(() => Promise.resolve());
}

export function mockCustomerRepoCreateTeamNotificationSettings({
  customerRepo,
}: {
  customerRepo: CustomerRepository;
}) {
  return vi
    .spyOn(customerRepo.getMutator(), "createTeamNotificationSettings")
    .mockImplementation(() => Promise.resolve());
}
