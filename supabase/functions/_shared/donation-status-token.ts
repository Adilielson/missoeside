// Token opaco de consulta de status: não expõe os dados pessoais do doador.
const enc = new TextEncoder();
const maxAgeSeconds = 7 * 24 * 60 * 60;

async function key() {
  const secret = Deno.env.get("DONATION_STATUS_SECRET") || "";
  if (secret.length < 32) throw new Error("DONATION_STATUS_SECRET deve ter pelo menos 32 caracteres");
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createStatusToken(donationId: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const signature = await crypto.subtle.sign("HMAC", await key(), enc.encode(donationId + ":" + exp));
  const sig = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return exp + "." + sig;
}

export async function verifyStatusToken(donationId: string, token: string): Promise<boolean> {
  if (!/^[0-9]{10}\.[0-9a-f]{64}$/.test(token)) return false;
  const [expString, hex] = token.split(".");
  const exp = Number(expString);
  if (exp <= Math.floor(Date.now() / 1000) || exp > Math.floor(Date.now() / 1000) + maxAgeSeconds) return false;
  const signature = new Uint8Array(hex.match(/../g)!.map((v) => Number.parseInt(v, 16)));
  return crypto.subtle.verify("HMAC", await key(), signature, enc.encode(donationId + ":" + expString));
}
