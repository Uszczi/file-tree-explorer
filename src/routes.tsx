import type { RouteObject } from "react-router-dom";
import { TREE_URL } from "./lib/tree/paths";
import { ErrorPage } from "./pages/ErrorPage";
import { HomePage } from "./pages/HomePage";
import { NodeDetailsPage } from "./pages/NodeDetailsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { TreeLayout } from "./pages/TreeLayout";

export const routes: RouteObject[] = [
  {
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <HomePage /> },
      {
        path: TREE_URL,
        element: <TreeLayout />,
        children: [{ path: ":nodePath?", element: <NodeDetailsPage /> }],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
