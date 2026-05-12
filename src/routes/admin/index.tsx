import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: () => {
    console.log("AdminIndex: redirecting to projects...");
    return <Navigate to="/admin/projects" />;
  },
});
