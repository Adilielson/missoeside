import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/equipe")({
  component: () => <Outlet />,
});
