import type { RouteObject } from "react-router-dom";
import { TREE_URL } from "./lib/tree/paths";
import { HomePage } from "./pages/HomePage";
import { NodeDetailsPage } from "./pages/NodeDetailsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { TreeLayout } from "./pages/TreeLayout";

export const routes: RouteObject[] = [
  { path: "/", element: <HomePage /> },
  {
    path: TREE_URL,
    element: <TreeLayout />,
    // Optional segment: "/tree" shows the root, "/tree/<encoded path>" any other node.
    children: [{ path: ":nodePath?", element: <NodeDetailsPage /> }],
  },
  { path: "*", element: <NotFoundPage /> },
];
