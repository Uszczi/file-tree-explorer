import {
  useId,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExamplesList } from "../components/ExamplesList";
import { ui } from "../components/ui";
import { ValidationErrors } from "../components/ValidationErrors";
import { TREE_URL } from "../lib/tree/paths";
import { stringifyForEditor } from "../lib/tree/serialize";
import type { ValidationError } from "../lib/tree/types";
import { parseTree } from "../lib/tree/validate";
import { useTree } from "../state/treeContext";

export function HomePage() {
  const { index, load } = useTree();
  const navigate = useNavigate();
  const [text, setText] = useState(() =>
    index === null ? "" : stringifyForEditor(index.root),
  );
  const [errors, setErrors] = useState<readonly ValidationError[]>([]);
  const textareaId = useId();
  const errorsId = useId();

  function loadText(source: string) {
    const result = parseTree(source);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    load(result.value);
    navigate(TREE_URL);
  }

  async function loadFile(file: File) {
    let content: string;
    try {
      content = await file.text();
    } catch {
      setErrors([{ path: "", message: `Could not read file "${file.name}"` }]);
      return;
    }
    setText(content);
    loadText(content);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadText(text);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.item(0);
    // Reset so that picking the same file again still fires a change event.
    event.target.value = "";
    if (file) void loadFile(file);
  }

  function handleDragOver(event: DragEvent<HTMLTextAreaElement>) {
    if (event.dataTransfer.types.includes("Files")) event.preventDefault();
  }

  function handleDrop(event: DragEvent<HTMLTextAreaElement>) {
    const file = event.dataTransfer.files.item(0);
    // Without a file this is a plain text drop, which the textarea handles itself.
    if (file === null) return;
    event.preventDefault();
    void loadFile(file);
  }

  function insertExample(exampleText: string) {
    setText(exampleText);
    setErrors([]);
  }

  const hasErrors = errors.length > 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <title>FileTree Explorer</title>

      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          📂 FileTree Explorer
        </h1>
        <p className={`mt-2 ${ui.muted}`}>
          Paste or upload a JSON description of a directory tree to browse and
          search it.
        </p>
      </header>

      {index !== null && (
        <p className="mb-6 flex flex-wrap items-center gap-x-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm dark:border-sky-900 dark:bg-sky-950">
          <span>
            A tree is already loaded:{" "}
            <strong className="break-all">{index.root.name}</strong>
          </span>
          <Link to={TREE_URL} className={ui.link}>
            Open it →
          </Link>
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <form
          onSubmit={handleSubmit}
          className={`${ui.card} flex flex-col gap-3 p-4 md:p-6`}
        >
          <label htmlFor={textareaId} className={ui.label}>
            Tree JSON
          </label>
          <textarea
            id={textareaId}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            rows={18}
            spellCheck={false}
            placeholder={
              '{ "name": "root", "type": "folder", "children": [...] }'
            }
            aria-invalid={hasErrors}
            aria-describedby={hasErrors ? errorsId : undefined}
            className={`${ui.input} min-h-64 resize-y font-mono text-xs leading-relaxed`}
          />
          <p className={`text-xs ${ui.muted}`}>
            Tip: you can also drop a .json file onto the editor.
          </p>

          <ValidationErrors id={errorsId} errors={errors} />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className={ui.primaryButton}
              disabled={text.trim() === ""}
            >
              Load tree
            </button>
            {/* The input is visually hidden; the label acts as the button and shows its focus. */}
            <label
              className={`${ui.button} cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sky-500`}
            >
              Upload file…
              <input
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
            {text !== "" && (
              <button
                type="button"
                className={ui.button}
                onClick={() => {
                  setText("");
                  setErrors([]);
                }}
              >
                Clear
              </button>
            )}
          </div>
        </form>

        <ExamplesList onSelect={insertExample} />
      </div>
    </main>
  );
}
