import { INVALID_EXAMPLES, VALID_EXAMPLES, type Example } from "./examples";
import { ui } from "./ui";

interface ExamplesListProps {
  readonly onSelect: (text: string) => void;
}

interface ExampleGroup {
  readonly title: string;
  readonly examples: readonly Example[];
  readonly dotClass: string;
}

const GROUPS: readonly ExampleGroup[] = [
  { title: "Valid", examples: VALID_EXAMPLES, dotClass: "bg-emerald-500" },
  { title: "With errors", examples: INVALID_EXAMPLES, dotClass: "bg-red-500" },
];

export function ExamplesList({ onSelect }: ExamplesListProps) {
  return (
    <section
      aria-labelledby="examples-heading"
      className={`${ui.card} self-start p-4`}
    >
      <h2 id="examples-heading" className="text-sm font-semibold">
        Examples
      </h2>
      <p className={`mt-1 text-xs ${ui.muted}`}>
        Click to insert one into the editor, then load it.
      </p>

      {GROUPS.map((group) => (
        <div key={group.title} className="mt-4">
          <h3
            className={`mb-1 text-xs font-medium tracking-wide uppercase ${ui.muted}`}
          >
            {group.title}
          </h3>
          <ul className="flex flex-col gap-0.5">
            {group.examples.map((example) => (
              <li key={example.id}>
                <button
                  type="button"
                  onClick={() => onSelect(example.text())}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 ${ui.focusRing}`}
                >
                  <span
                    aria-hidden="true"
                    className={`size-1.5 shrink-0 rounded-full ${group.dotClass}`}
                  />
                  {example.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
