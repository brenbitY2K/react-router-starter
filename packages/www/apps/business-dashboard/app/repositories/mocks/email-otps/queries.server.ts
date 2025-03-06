import { type EmailOTPRepository } from "../../email-otps.server.js";
import { vi } from "vitest";
import {
  mockedEmailOTPFullSelect,
  mockedEmailOTPForEmailChangeFullSelect,
} from "./data.server.js";
import { type DeepPartial, mergeDeep } from "../utils.js";

export function mockEmailOTPRepoQueryEmailOTPForLogin({
  emailOTPRepo,
  data,
}: {
  emailOTPRepo: EmailOTPRepository;
  data?: DeepPartial<ReturnType<typeof mockedEmailOTPFullSelect>>;
}) {
  return vi
    .spyOn(emailOTPRepo.getQuerier(), "queryEmailOTPForLogin")
    .mockImplementation(({ email, code }: { email: string; code: string }) => {
      const mockData = mockedEmailOTPFullSelect();
      const mergedData = mergeDeep({ ...mockData, email, code }, data || {});
      return Promise.resolve(mergedData);
    });
}

export function mockEmailOTPRepoQueryEmailOTPForEmailChange({
  emailOTPRepo,
  data,
}: {
  emailOTPRepo: EmailOTPRepository;
  data?: DeepPartial<ReturnType<typeof mockedEmailOTPForEmailChangeFullSelect>>;
}) {
  return vi
    .spyOn(emailOTPRepo.getQuerier(), "queryEmailOTPForEmailChange")
    .mockImplementation(
      ({ userId, code }: { userId: string; code: string }) => {
        const mockData = mockedEmailOTPForEmailChangeFullSelect();
        const mergedData = mergeDeep({ ...mockData, userId, code }, data || {});
        return Promise.resolve(mergedData);
      },
    );
}

export function mockEmailOTPRepoQueryEmailOTPForEmailChangeByUserId({
  emailOTPRepo,
  data,
}: {
  emailOTPRepo: EmailOTPRepository;
  data?: DeepPartial<ReturnType<typeof mockedEmailOTPForEmailChangeFullSelect>>;
}) {
  return vi
    .spyOn(emailOTPRepo.getQuerier(), "queryEmailOTPForEmailChangeByUserId")
    .mockImplementation(({ userId }: { userId: string }) => {
      const mockData = mockedEmailOTPForEmailChangeFullSelect();
      const mergedData = mergeDeep({ ...mockData, userId }, data || {});
      return Promise.resolve(mergedData);
    });
}
