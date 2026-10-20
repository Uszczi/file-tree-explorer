const BASE = 1024;
const UNITS = ["B", "KB", "MB", "GB"] as const;

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function decimalsFor(unitIndex: number): number {
  return unitIndex === 0 ? 0 : 1;
}

export function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    throw new RangeError(`Invalid size: ${bytes}`);
  }

  let value = bytes;
  let unitIndex = 0;

  while (
    unitIndex < UNITS.length - 1 &&
    round(value, decimalsFor(unitIndex)) >= BASE
  ) {
    value /= BASE;
    unitIndex++;
  }

  return `${round(value, decimalsFor(unitIndex))} ${UNITS[unitIndex]}`;
}
