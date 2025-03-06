import { type SessionRepository } from "../../sessions.server.js";
import { vi } from "vitest";

export function mockSessionRepoCreateSession({
  sessionRepo,
}: {
  sessionRepo: SessionRepository;
}) {
  return vi
    .spyOn(sessionRepo.getMutator(), "createSession")
    .mockImplementation(() => Promise.resolve());
}

export function mockSessionRepoUpdateSession({
  sessionRepo,
}: {
  sessionRepo: SessionRepository;
}) {
  return vi
    .spyOn(sessionRepo.getMutator(), "updateSession")
    .mockImplementation(() => Promise.resolve());
}

export function mockSessionRepoDeleteSession({
  sessionRepo,
}: {
  sessionRepo: SessionRepository;
}) {
  return vi
    .spyOn(sessionRepo.getMutator(), "deleteSession")
    .mockImplementation(() => Promise.resolve());
}

export function mockSessionRepoDeleteAllSessionsExceptCurrent({
  sessionRepo,
}: {
  sessionRepo: SessionRepository;
}) {
  return vi
    .spyOn(sessionRepo.getMutator(), "deleteAllSessionsExceptCurrent")
    .mockImplementation(() => Promise.resolve());
}
