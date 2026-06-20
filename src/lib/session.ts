// Signed-session helpers (HMAC-SHA256). Implemented with Web Crypto so the
// same code runs in both the Node.js runtime (route handlers / server
// components) and the Edge runtime (middleware).

export interface Session {
  name: string;
  role: "admin" | "user";
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): ArrayBuffer {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.PIN_SECRET || "";
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signSession(data: Session): Promise<string> {
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify(data)));
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return payload + "." + toBase64Url(new Uint8Array(sig));
}

export async function verifySession(token: string): Promise<Session | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  try {
    const key = await getKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(sig),
      new TextEncoder().encode(payload)
    );
    if (!valid) return null;
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    if (
      data &&
      typeof data.name === "string" &&
      (data.role === "admin" || data.role === "user")
    ) {
      return data as Session;
    }
    return null;
  } catch {
    return null;
  }
}
