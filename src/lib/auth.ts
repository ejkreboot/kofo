const encoder = new TextEncoder();

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export interface TokenPayload {
  albumId: string;
  bucketId: string;
  albumName: string;
  exp: number;
}

const TOKEN_TTL = 60 * 60 * 4; // 4 hours

export async function createToken(
  payload: Omit<TokenPayload, "exp">,
  secret: string,
): Promise<string> {
  const data: TokenPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL };
  const json = JSON.stringify(data);
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(json));
  return `${toBase64Url(encoder.encode(json).buffer as ArrayBuffer)}.${toBase64Url(sig)}`;
}

export async function verifyToken(
  token: string,
  secret: string,
): Promise<TokenPayload | null> {
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;

  const payloadBytes = fromBase64Url(payloadB64);
  const sigBytes = fromBase64Url(sigB64);
  const key = await getKey(secret);

  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, payloadBytes);
  if (!valid) return null;

  const payload: TokenPayload = JSON.parse(new TextDecoder().decode(payloadBytes));
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;

  return payload;
}

export const COOKIE_NAME = "album_token";
