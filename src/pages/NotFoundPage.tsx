import { Link } from "react-router-dom";
import { ui } from "../components/ui";

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <title>Page not found · FileTree Explorer</title>
      <p className="text-5xl" aria-hidden="true">
        🗂️
      </p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link to="/" className={ui.primaryButton}>
        Back to start
      </Link>
    </main>
  );
}
