// Shared Tailwind class lists for elements that repeat across components.

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500";

const buttonBase = `inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

export const ui = {
  focusRing,
  button: `${buttonBase} border border-zinc-300 bg-white px-3 py-1.5 text-zinc-800 shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800`,
  primaryButton: `${buttonBase} border border-transparent bg-sky-600 px-3 py-1.5 text-white shadow-xs hover:bg-sky-700 dark:bg-sky-500 dark:text-zinc-950 dark:hover:bg-sky-400`,
  smallButton: `${buttonBase} rounded px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100`,
  input:
    "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs outline-none placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 aria-invalid:border-red-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100",
  link: `rounded-sm text-sky-700 underline-offset-2 hover:underline dark:text-sky-400 ${focusRing}`,
  card: "rounded-lg border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900",
  label: "text-sm font-medium text-zinc-700 dark:text-zinc-300",
  muted: "text-zinc-500 dark:text-zinc-400",
} as const;
