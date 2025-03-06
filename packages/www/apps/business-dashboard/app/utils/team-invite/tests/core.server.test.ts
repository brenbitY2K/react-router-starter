import { afterEach, describe, expect, it, vi } from "vitest";
import { TeamQuerier } from "~/repositories/teams.server.js";
import { generateMockCuid } from "~/repositories/mocks/utils.js";
import {
  mockedTeamEmailInviteFullSelect,
  mockedTeamFullSelect,
} from "~/repositories/mocks/teams/data.server.js";
import {
  createTeamInviteLink,
  getTeamInviteInfoIfValid,
} from "../core.server.js";

describe("getTeamInviteInfoIfValid", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Returns email invite if email invite is valid", async () => {
    const emailInviteResponse = mockedTeamEmailInviteFullSelect();
    const teamQuerier = new TeamQuerier();

    const queryEmailInviteSpy = vi
      .spyOn(teamQuerier, "queryEmailInvite")
      .mockResolvedValue(emailInviteResponse);

    const queryTeamSpy = vi
      .spyOn(teamQuerier, "queryTeam")
      .mockResolvedValue(mockedTeamFullSelect());

    const result = await getTeamInviteInfoIfValid({
      teamQuerier,
      code: generateMockCuid(),
      teamId: generateMockCuid(),
    });

    expect(queryEmailInviteSpy).toBeCalledTimes(1);
    expect(result).toEqual({
      code: emailInviteResponse.code,
      type: "email",
      teamId: emailInviteResponse.teamId,
      role: "admin",
    });
    expect(queryTeamSpy).toBeCalledTimes(0);
  });

  it("Returns shareable invite if shareable invite is valid", async () => {
    const teamResponse = mockedTeamFullSelect();
    const teamQuerier = new TeamQuerier();

    const queryEmailInviteSpy = vi
      .spyOn(teamQuerier, "queryEmailInvite")
      .mockResolvedValue(undefined);

    const queryTeamSpy = vi
      .spyOn(teamQuerier, "queryTeam")
      .mockResolvedValue(teamResponse);

    const result = await getTeamInviteInfoIfValid({
      teamQuerier,
      code: teamResponse.shareableInviteCode!,
      teamId: teamResponse.id,
    });

    expect(queryEmailInviteSpy).toBeCalledTimes(1);
    expect(queryTeamSpy).toBeCalledTimes(1);
    expect(result).toEqual({
      code: teamResponse.shareableInviteCode,
      type: "shareable",
      teamId: teamResponse.id,
      role: "member",
    });
  });

  it("Returns null if code does not equal anything", async () => {
    const teamResponse = mockedTeamFullSelect();
    const teamQuerier = new TeamQuerier();

    const queryEmailInviteSpy = vi
      .spyOn(teamQuerier, "queryEmailInvite")
      .mockResolvedValue(undefined);

    const queryTeamSpy = vi
      .spyOn(teamQuerier, "queryTeam")
      .mockResolvedValue(teamResponse);

    const result = await getTeamInviteInfoIfValid({
      teamQuerier,
      code: "random-code-not-equal-to-anything",
      teamId: generateMockCuid(),
    });

    expect(queryEmailInviteSpy).toBeCalledTimes(1);
    expect(queryTeamSpy).toBeCalledTimes(1);
    expect(result).toBeNull();
  });

  it("Returns null if both queries are undefined", async () => {
    const teamQuerier = new TeamQuerier();

    const queryEmailInviteSpy = vi
      .spyOn(teamQuerier, "queryEmailInvite")
      .mockResolvedValue(undefined);

    const queryTeamSpy = vi
      .spyOn(teamQuerier, "queryTeam")
      .mockResolvedValue(undefined);

    const result = await getTeamInviteInfoIfValid({
      teamQuerier,
      code: "random-code-not-equal-to-anything",
      teamId: generateMockCuid(),
    });

    expect(queryEmailInviteSpy).toBeCalledTimes(1);
    expect(queryTeamSpy).toBeCalledTimes(1);
    expect(result).toBeNull();
  });
});

describe("createTeamInviteLink", () => {
  it("Returns proper link", () => {
    expect(createTeamInviteLink("slug-value", "code-value")).toContain(
      "/teams/slug-value/join/code-value",
    );
  });
});
