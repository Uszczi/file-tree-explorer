import { EXAMPLES, type Example } from "./examples";
import { ui } from "./ui";

interface ExamplesListProps {
  readonly onSelect: (text: string) => void;
}

const GROUPS: readonly { readonly title: string; readonly examples: readonly Example[] }[] = [
  { title: "Valid", examples: EXAMPLES.filter((example) => example.valid) },
  { title: "With errors", examples: EXAMPLES.filter((example) => !example.valid) },
];

export function ExamplesList({ onSelect }: ExamplesListProps) {
  return (
    <section aria-labelledby="examples-heading" className={`${ui.card} self-start p-4`}>
      <h2 id="examples-heading" className="text-sm font-semibold">
        Examples
      </h2>
      <p className={`mt-1 text-xs ${ui.muted}`}>Click to load one into the editor.</p>

      {GROUPS.map((group) => (
        <div key={group.title} className="mt-4">
          <h3 className={`mb-1 text-xs font-medium tracking-wide uppercase ${ui.muted}`}>{group.title}</h3>
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
                    className={`size-1.5 shrink-0 rounded-full ${example.valid ? "bg-emerald-500" : "bg-red-500"}`}
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
