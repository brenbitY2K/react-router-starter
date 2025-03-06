import { afterEach, describe, expect, it, vi } from "vitest";
import { getRouteParamOrThrow } from "../core.server.js";

describe("getRouteParamOrThrow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Return param if valid", async () => {
    const throwerMock = vi.fn(() => {
      throw new Error("Thrown");
    });

    const param = "test-param";
    const params = { "test-param": "result" };

    const result = getRouteParamOrThrow({
      thrower: throwerMock,
      param,
      params,
    });

    expect(result).toEqual("result");
  });

  it("Throw if param is not valid", async () => {
    const throwerMock = vi.fn(() => {
      throw new Error("Thrown");
    });

    const param = "non-existent-param";
    const params = { "test-param": "result" };

    expect(() => {
      getRouteParamOrThrow({
        thrower: throwerMock,
        param,
        params,
      });
    }).toThrow();
  });
});
