import {
  isRouteErrorResponse,
  Link,
  useNavigate,
  useRouteError,
} from "react-router-dom";
import { ui } from "../components/ui";
import { useTree } from "../state/treeContext";

function describeError(error: unknown): string {
  if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`;
  if (error instanceof Error) return error.message;
  return String(error);
}

// Route-level error boundary. The loaded tree is persisted, so an error caused by it would
// come back after every reload; "Clear saved tree" gives the user a way out.
export function ErrorPage() {
  const error = useRouteError();
  const { index, clear } = useTree();
  const navigate = useNavigate();

  function clearAndRestart() {
    clear();
    navigate("/", { replace: true });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <title>Something went wrong · FileTree Explorer</title>
      <p className="text-5xl" aria-hidden="true">
        ⚠️
      </p>
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className={ui.muted}>The page could not be displayed.</p>
      <pre className="max-h-40 w-full overflow-auto rounded-md bg-zinc-100 p-3 text-left text-xs whitespace-pre-wrap dark:bg-zinc-800">
        {describeError(error)}
      </pre>
      <div className="flex flex-wrap justify-center gap-2">
        <Link to="/" className={ui.button}>
          Back to start
        </Link>
        {index !== null && (
          <button
            type="button"
            className={ui.primaryButton}
            onClick={clearAndRestart}
          >
            Clear saved tree
          </button>
        )}
      </div>
    </main>
  );
}
