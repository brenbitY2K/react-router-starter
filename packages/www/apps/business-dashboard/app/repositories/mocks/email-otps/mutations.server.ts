import { type EmailOTPRepository } from "../../email-otps.server.js";
import { vi } from "vitest";
import { generateMockCuid } from "../utils.js";

export function mockEmailOTPRepoCreateLoginOTP({
  emailOTPRepo,
}: {
  emailOTPRepo: EmailOTPRepository;
}) {
  return vi
    .spyOn(emailOTPRepo.getMutator(), "createLoginOTP")
    .mockImplementation(() => Promise.resolve(generateMockCuid()));
}

export function mockEmailOTPRepoCreateEmailChangeOTP({
  emailOTPRepo,
}: {
  emailOTPRepo: EmailOTPRepository;
}) {
  return vi
    .spyOn(emailOTPRepo.getMutator(), "createEmailChangeOTP")
    .mockImplementation(() => Promise.resolve(generateMockCuid()));
}

export function mockEmailOTPRepoDeleteAllLoginOTPsForEmail({
  emailOTPRepo,
}: {
  emailOTPRepo: EmailOTPRepository;
}) {
  return vi
    .spyOn(emailOTPRepo.getMutator(), "deleteAllLoginOTPsForEmail")
    .mockImplementation(() => Promise.resolve());
}

export function mockEmailOTPRepoDeleteEmailChangeOTPForUserId({
  emailOTPRepo,
}: {
  emailOTPRepo: EmailOTPRepository;
}) {
  return vi
    .spyOn(emailOTPRepo.getMutator(), "deleteEmailChangeOTPForUserId")
    .mockImplementation(() => Promise.resolve());
}
