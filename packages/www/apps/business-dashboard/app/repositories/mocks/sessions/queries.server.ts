import { type SessionRepository } from "../../sessions.server.js";
import { vi } from "vitest";
import {
  mockedSessionFullSelect,
  mockedMultipleSessions,
} from "./data.server.js";
import { type DeepPartial, mergeDeep } from "../utils.js";

export function mockSessionRepoQuerySession({
  sessionRepo,
  data,
}: {
  sessionRepo: SessionRepository;
  data?: DeepPartial<ReturnType<typeof mockedSessionFullSelect>>;
}) {
  return vi
    .spyOn(sessionRepo.getQuerier(), "querySession")
    .mockImplementation(({ id }: { id: string }) => {
      const mockData = mockedSessionFullSelect();

      const mergedData = mergeDeep({ ...mockData, id }, data || {});
      return Promise.resolve(mergedData);
    });
}

export function mockSessionRepoQuerySessionUndefined({
  sessionRepo,
}: {
  sessionRepo: SessionRepository;
}) {
  return vi
    .spyOn(sessionRepo.getQuerier(), "querySession")
    .mockResolvedValue(undefined);
}

export function mockSessionRepoQueryAllActiveSessions({
  sessionRepo,
  data,
}: {
  sessionRepo: SessionRepository;
  data?: DeepPartial<ReturnType<typeof mockedSessionFullSelect>>[] | null;
}) {
  return vi
    .spyOn(sessionRepo.getQuerier(), "queryAllActiveSessions")
    .mockImplementation(({ userId }: { userId: string }) => {
      if (data === undefined) {
        const defaultSessions = mockedMultipleSessions();
        return Promise.resolve(
          defaultSessions.map((session) => ({ ...session, userId })),
        );
      }

      if (data === null || data.length === 0) {
        return Promise.resolve([]);
      }

      const defaultSessions = mockedMultipleSessions(data.length);
      const mergedData = data.map((item, index) => {
        const mergedSession = mergeDeep(
          { ...defaultSessions[index], userId },
          item || {},
        );
        return mergedSession;
      });

      return Promise.resolve(mergedData);
    });
}

export function mockSessionRepoQueryAllActiveSessionsUndefined({
  sessionRepo,
}: {
  sessionRepo: SessionRepository;
}) {
  return vi
    .spyOn(sessionRepo.getQuerier(), "queryAllActiveSessions")
    .mockResolvedValue(undefined);
}
