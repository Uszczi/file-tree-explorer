import { matchRoutes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ROOT_PATH, toNodeUrl } from "./lib/tree/paths";
import { routes } from "./routes";

function nodePathParam(url: string): string | undefined {
  const matches = matchRoutes(routes, url);
  return matches?.at(-1)?.params.nodePath;
}

describe("routes", () => {
  it("matches the root node URL without a param", () => {
    const matches = matchRoutes(routes, toNodeUrl(ROOT_PATH));
    expect(matches?.at(-1)?.route.path).toBe(":nodePath?");
    expect(nodePathParam(toNodeUrl(ROOT_PATH))).toBeUndefined();
  });

  // Guards the contract with NodeDetailsPage: the router decodes once, toNodeUrl encodes once.
  it.each([
    "src",
    "src/components/Button.tsx",
    "dir/my file.txt",
    "a/#b?/100%.txt",
    "100%25.txt",
    "zażółć/ü.ts",
  ])("passes %j back unchanged as :nodePath", (path) => {
    expect(nodePathParam(toNodeUrl(path))).toBe(path);
  });

  it("falls back to the not found route", () => {
    expect(matchRoutes(routes, "/nope")?.at(-1)?.route.path).toBe("*");
  });
});
