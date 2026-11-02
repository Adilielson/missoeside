import { createFileRoute } from "@tanstack/react-router";
import { DoarCheckout } from "./doar2";

// Checkout oficial: /doar recebe exatamente o formulário Asaas de /doar2,
// com o projeto selecionado preservado no parâmetro ?project=<slug>.
export const Route = createFileRoute("/doar")({
  validateSearch: (search: Record<string, unknown>) => ({
    project: typeof search.project === "string" && /^[\p{L}\p{N}-]{1,160}$/u.test(search.project)
      ? search.project : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Doe Agora — IDE Missões para o Mundo" },
      { name: "description", content: "Apoie uma missão com doação segura via Asaas." },
    ],
  }),
  component: DoarOficial,
});

function DoarOficial() {
  const { project } = Route.useSearch();
  return <DoarCheckout projectSlug={project} />;
}
