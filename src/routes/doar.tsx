// Restabelece o checkout Asaas original sem modificar /doar2.
// Mantém o parâmetro de projeto para doações direcionadas às missões.
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/doar")({
  component: RestoreAsaasCheckout,
});

function RestoreAsaasCheckout() {
  const search = Route.useSearch() as { project?: string };
  return <Navigate to="/doar2" search={{ project: search.project }} replace />;
}
