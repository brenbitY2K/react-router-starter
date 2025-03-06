import { afterEach, describe, expect, it, vi } from "vitest";
import { checkIfCustomerHasPermissionsOrThrow } from "../core.server.js";
import { TeamQuerier } from "~/repositories/teams.server.js";
import { mockedCustomerToTeamRelationFullSelect } from "~/repositories/mocks/teams/data.server.js";

describe("UserLoaderEmailOTPAuthService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Do nothing if customer has permissions", async () => {
    const throwerMock = vi.fn(() => {
      throw new Error("Thrown");
    });

    const teamQuerier = new TeamQuerier();
    const queryCustomerToTeamRelationSpy = vi
      .spyOn(teamQuerier, "queryCustomerToTeamRelation")
      .mockResolvedValue({
        ...mockedCustomerToTeamRelationFullSelect(),
        role: "admin",
      });

    await checkIfCustomerHasPermissionsOrThrow({
      customerId: "1234",
      role: "admin",
      teamQuerier: teamQuerier,
      teamId: "1234",
      thrower: throwerMock,
    });

    expect(throwerMock).toBeCalledTimes(0);
    expect(queryCustomerToTeamRelationSpy).toBeCalledTimes(1);
  });

  it("Throw if the customer does not have permission (owner)", async () => {
    const throwerMock = vi.fn(() => {
      throw new Error("Thrown");
    });

    const teamQuerier = new TeamQuerier();
    vi.spyOn(teamQuerier, "queryCustomerToTeamRelation").mockResolvedValue({
      ...mockedCustomerToTeamRelationFullSelect(),
      role: "member",
    });

    await expect(
      checkIfCustomerHasPermissionsOrThrow({
        customerId: "1234",
        role: "owner",
        teamQuerier,
        thrower: throwerMock,
        teamId: "1234",
      }),
    ).rejects.toThrow();
  });

  it("Throw if the customer does not have permission (admin).", async () => {
    const throwerMock = vi.fn(() => {
      throw new Error("Thrown");
    });

    const teamQuerier = new TeamQuerier();
    vi.spyOn(teamQuerier, "queryCustomerToTeamRelation").mockResolvedValue({
      ...mockedCustomerToTeamRelationFullSelect(),
      role: "member",
    });

    await expect(
      checkIfCustomerHasPermissionsOrThrow({
        customerId: "1234",
        role: "admin",
        teamQuerier,
        thrower: throwerMock,
        teamId: "1234",
      }),
    ).rejects.toThrow();
  });

  it("Throw if the relation query returns undefined", async () => {
    const throwerMock = vi.fn(() => {
      throw new Error("Thrown");
    });

    const teamQuerier = new TeamQuerier();
    vi.spyOn(teamQuerier, "queryCustomerToTeamRelation").mockResolvedValue(
      undefined,
    );

    await expect(
      checkIfCustomerHasPermissionsOrThrow({
        customerId: "1234",
        role: "owner",
        teamQuerier,
        thrower: throwerMock,
        teamId: "1234",
      }),
    ).rejects.toThrow();
  });
});
