// Prefixa URLs relativas de assets Lovable (/__l5e/assets-v1/...) com o domínio
// absoluto do site publicado, garantindo que funcionem em qualquer host
// (Lovable hospedado, Vercel ou domínio próprio).
const LOVABLE_HOST = "https://missoeside.lovable.app";

export function assetUrl(input: string | { url: string }): string {
  const url = typeof input === "string" ? input : input?.url ?? "";
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/__l5e/")) return `${LOVABLE_HOST}${url}`;
  return url;
}
