import { type CustomerRepository } from "../../customers.server.js";
import { vi } from "vitest";
import {
  mockedCustomerFullSelect,
  mockedCustomerFlowTrackerFullSelect,
  mockedMultipleTeams,
  mockedMultipleNotificationSettings,
} from "./data.server.js";
import { type DeepPartial, mergeDeep } from "../utils.js";

export function mockCustomerRepoQueryCustomer({
  customerRepo,
  data,
}: {
  customerRepo: CustomerRepository;
  data?: DeepPartial<ReturnType<typeof mockedCustomerFullSelect>>;
}) {
  return vi
    .spyOn(customerRepo.getQuerier(), "queryCustomer")
    .mockImplementation(({ customerId }: { customerId: string }) => {
      const mockData = mockedCustomerFullSelect();
      const mergedData = mergeDeep({ ...mockData, id: customerId }, data || {});
      return Promise.resolve(mergedData);
    });
}

export function mockCustomerRepoQueryCustomerUndefined({
  customerRepo,
}: {
  customerRepo: CustomerRepository;
}) {
  return vi
    .spyOn(customerRepo.getQuerier(), "queryCustomer")
    .mockResolvedValue(undefined);
}

export function mockCustomerRepoQueryCustomerByUserId({
  customerRepo,
  data,
}: {
  customerRepo: CustomerRepository;
  data?: DeepPartial<ReturnType<typeof mockedCustomerFullSelect>>;
}) {
  return vi
    .spyOn(customerRepo.getQuerier(), "queryCustomerByUserId")
    .mockImplementation(({ userId }: { userId: string }) => {
      const mockData = mockedCustomerFullSelect();
      const mergedData = mergeDeep({ ...mockData, userId }, data || {});
      return Promise.resolve(mergedData);
    });
}

export function mockCustomerRepoQueryCustomerByUserIdUndefined({
  customerRepo,
}: {
  customerRepo: CustomerRepository;
}) {
  return vi
    .spyOn(customerRepo.getQuerier(), "queryCustomerByUserId")
    .mockResolvedValue(undefined);
}

export function mockCustomerRepoQueryTeams({
  customerRepo,
  data,
}: {
  customerRepo: CustomerRepository;
  data?: DeepPartial<ReturnType<typeof mockedMultipleTeams>[number]>[] | null;
}) {
  return vi
    .spyOn(customerRepo.getQuerier(), "queryTeams")
    .mockImplementation(() => {
      if (data === undefined) {
        return Promise.resolve(mockedMultipleTeams());
      }

      if (data === null || data.length === 0) {
        return Promise.resolve([]);
      }

      const defaultData = mockedMultipleTeams(data.length);
      const mergedData = data.map((item, index) =>
        mergeDeep(defaultData[index], item || {}),
      );

      return Promise.resolve(mergedData);
    });
}

export function mockCustomerRepoQueryTeamsUndefined({
  customerRepo,
}: {
  customerRepo: CustomerRepository;
}) {
  return vi
    .spyOn(customerRepo.getQuerier(), "queryTeams")
    .mockResolvedValue(undefined);
}

export function mockCustomerRepoQueryCustomerFlowTracker({
  customerRepo,
  data,
}: {
  customerRepo: CustomerRepository;
  data?: DeepPartial<ReturnType<typeof mockedCustomerFlowTrackerFullSelect>>;
}) {
  return vi
    .spyOn(customerRepo.getQuerier(), "queryCustomerFlowTracker")
    .mockImplementation(({ customerId }: { customerId: string }) => {
      const mockData = mockedCustomerFlowTrackerFullSelect();
      const mergedData = mergeDeep({ ...mockData, customerId }, data || {});
      return Promise.resolve(mergedData);
    });
}

export function mockCustomerRepoQueryCustomerFlowTrackerUndefined({
  customerRepo,
}: {
  customerRepo: CustomerRepository;
}) {
  return vi
    .spyOn(customerRepo.getQuerier(), "queryCustomerFlowTracker")
    .mockResolvedValue(undefined);
}

export function mockCustomerRepoQueryTeamNotificationSettings({
  customerRepo,
  data,
}: {
  customerRepo: CustomerRepository;
  data?:
    | DeepPartial<
        ReturnType<typeof mockedMultipleNotificationSettings>[number]
      >[]
    | null;
}) {
  return vi
    .spyOn(customerRepo.getQuerier(), "queryTeamNotificationSettings")
    .mockImplementation(() => {
      if (data === undefined) {
        return Promise.resolve(mockedMultipleNotificationSettings());
      }

      if (data === null || data.length === 0) {
        return Promise.resolve([]);
      }

      const defaultData = mockedMultipleNotificationSettings(data.length);
      const mergedData = data.map((item, index) =>
        mergeDeep(defaultData[index], item || {}),
      );

      return Promise.resolve(mergedData);
    });
}

export function mockCustomerRepoQueryTeamNotificationSettingsUndefined({
  customerRepo,
}: {
  customerRepo: CustomerRepository;
}) {
  return vi
    .spyOn(customerRepo.getQuerier(), "queryTeamNotificationSettings")
    .mockResolvedValue(undefined);
}
