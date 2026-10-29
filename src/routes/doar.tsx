// Volta do checkout Asaas pela rota oficial /doar.
// /doar2 permanece preservado para homologação e rollback.
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/doar")({
  component: DoarAsaasRedirect,
});

function DoarAsaasRedirect() {
  const search = Route.useSearch() as { project?: string };
  return <Navigate to="/doar2" search={{ project: search.project }} replace />;
}
