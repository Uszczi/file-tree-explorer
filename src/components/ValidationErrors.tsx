import type { ValidationError } from "../lib/tree/types";
import { MAX_ERRORS } from "../lib/tree/validate";

interface ValidationErrorsProps {
  readonly id: string;
  readonly errors: readonly ValidationError[];
}

export function ValidationErrors({ id, errors }: ValidationErrorsProps) {
  if (errors.length === 0) return null;

  return (
    <div
      id={id}
      role="alert"
      className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
    >
      <p className="font-medium">
        Could not load the tree ({errors.length >= MAX_ERRORS ? `first ${MAX_ERRORS}` : errors.length}{" "}
        {errors.length === 1 ? "problem" : "problems"}):
      </p>
      <ul className="mt-2 flex max-h-64 list-disc flex-col gap-1 overflow-auto ps-5">
        {errors.map((error, index) => (
          <li key={`${index}-${error.path}`}>
            {error.path !== "" && <code className="bg-red-100 dark:bg-red-900/60">{error.path}</code>}{" "}
            {error.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
