import { readFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";

const source = path => readFileSync(path, "utf8");
const checkout = source("src/routes/doar2.tsx");
const backend = source("supabase/functions/create-donation/index.ts");
const canonical = source("src/routes/doar.tsx");
const projectLinks = [
  "src/routes/projeto.$slug.tsx",
  "src/routes/nossos-projetos.tsx",
  "src/components/sections/Causes.tsx",
];

assert.match(canonical, /createFileRoute\("\/doar"\)/, "Official /doar route is missing");
assert.match(canonical, /<DoarCheckout projectSlug=\{project\}/, "/doar must render Asaas form with project");
assert.doesNotMatch(canonical, /<Navigate/, "Official /doar may not redirect");
assert.match(checkout, /export function DoarCheckout/, "Checkout component must be shared");
assert.match(checkout, /functions\.invoke\("create-donation"/, "Asaas integration must be preserved");
assert.match(checkout, /campaign: projectSlug \|\| "Geral"/, "Project ID must be sent to checkout backend");
assert.match(checkout, /Sua doação será destinada a:/, "Project should appear in checkout");
assert.match(checkout, /FunctionsHttpError/, "Backend errors should be decoded and displayed");
assert.match(checkout, /setPaymentCreated\(true\)/, "Completed Asaas charge must disable repeat submissions");
assert.match(backend, /ASAAS_ENV_KEY_MISMATCH/, "Asaas credentials must match their environment");
assert.match(backend, /pix_pending: pixPending/, "A created payment must survive delayed Pix QR generation");
assert.doesNotMatch(backend, /\/payments\/\$\{payment\.id\}\/pixQrCode/,
  "Never fetch Pix QR using a recurring subscription ID");
for (const path of projectLinks) {
  const s = source(path);
  assert.match(s, /to="\/doar" search=\{\{ project: project\.slug \}\}/,
    path + ": donation action does not include selected project slug");
  assert.doesNotMatch(s, /to="\/doar2" search=/,
    path + ": project button still points to legacy checkout path");
}
assert.equal(existsSync("src/components/sections/CustomDonation.tsx"), false,
  "Temporary bank account / static PIX page must be removed");
console.log("Donation routes validated: /doar, three project links, project tracking, no temporary page.");
