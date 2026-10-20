import { describe, expect, it } from "vitest";
import { formatSize } from "./formatSize";

describe("formatSize", () => {
  it.each([
    [0, "0 B"],
    [1, "1 B"],
    [1023, "1023 B"],
    [1024, "1 KB"],
    [1536, "1.5 KB"],
    [10 * 1024 + 51, "10 KB"],
    [1048575, "1 MB"],
    [1024 ** 2, "1 MB"],
    [5.25 * 1024 ** 2, "5.3 MB"],
    [1024 ** 3 - 1, "1 GB"],
    [1024 ** 3, "1 GB"],
    [2.5 * 1024 ** 3, "2.5 GB"],
    [1024 ** 4, "1024 GB"],
  ])("formats %d bytes as %s", (bytes, expected) => {
    expect(formatSize(bytes)).toBe(expected);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    "throws for invalid size %d",
    (bytes) => {
      expect(() => formatSize(bytes)).toThrow(RangeError);
    },
  );
});
