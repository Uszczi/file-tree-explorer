import { Link, useLocation, type LinkProps } from "react-router-dom";
import { toNodeUrl } from "../lib/tree/paths";
import type { NodePath } from "../lib/tree/types";

interface NodeLinkProps extends Omit<LinkProps, "to"> {
  readonly path: NodePath;
}

/** Link to a node's details that keeps the current query string, so an active search survives navigation. */
export function NodeLink({ path, ...props }: NodeLinkProps) {
  const { search } = useLocation();
  return <Link to={{ pathname: toNodeUrl(path), search }} {...props} />;
}
