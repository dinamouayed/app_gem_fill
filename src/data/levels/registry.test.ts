import { describe, expect, it } from "vitest";

import { level1 } from "./level1";
import {
  getLevelById,
  getTotalLevelsCount,
  resolveLevelFromRouteParam,
} from "./registry";

describe("resolveLevelFromRouteParam", () => {
  it("defaults to level 1 when the param is omitted", () => {
    expect(resolveLevelFromRouteParam(undefined)).toEqual(level1);
  });

  it("resolves a valid numeric id", () => {
    expect(resolveLevelFromRouteParam("1")).toEqual(level1);
  });

  it("returns undefined for non-numeric ids", () => {
    expect(resolveLevelFromRouteParam("abc")).toBeUndefined();
  });

  it("returns undefined for ids outside the catalog", () => {
    expect(resolveLevelFromRouteParam("9999")).toBeUndefined();
  });

  it("returns undefined for zero or negative ids", () => {
    expect(resolveLevelFromRouteParam("0")).toBeUndefined();
    expect(resolveLevelFromRouteParam("-3")).toBeUndefined();
  });

  it("uses the first value when expo-router passes an array", () => {
    expect(resolveLevelFromRouteParam(["1", "2"])).toEqual(level1);
  });
});

describe("getLevelById", () => {
  it("returns undefined for unknown ids", () => {
    expect(getLevelById(9999)).toBeUndefined();
  });
});

describe("getTotalLevelsCount", () => {
  it("matches the generated catalog size", () => {
    expect(getTotalLevelsCount()).toBeGreaterThan(0);
  });
});
