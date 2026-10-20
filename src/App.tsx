import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routes } from "./routes";
import { useTree } from "./state/treeContext";

const router = createBrowserRouter(routes);

function App() {
  const { hydrated } = useTree();

  if (!hydrated) {
    return (
      <p
        role="status"
        className="flex min-h-dvh items-center justify-center text-sm text-zinc-500 dark:text-zinc-400"
      >
        Loading…
      </p>
    );
  }

  return <RouterProvider router={router} />;
}

export default App;
