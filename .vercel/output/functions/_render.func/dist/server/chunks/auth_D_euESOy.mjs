const encoder = new TextEncoder();
function toBase64Url(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(s) {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
async function getKey(secret) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), {
    name: "HMAC",
    hash: "SHA-256"
  }, false, ["sign", "verify"]);
}
const TOKEN_TTL = 60 * 60 * 4;
async function createToken(payload, secret) {
  const data = {
    ...payload,
    exp: Math.floor(Date.now() / 1e3) + TOKEN_TTL
  };
  const json = JSON.stringify(data);
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(json));
  return `${toBase64Url(encoder.encode(json).buffer)}.${toBase64Url(sig)}`;
}
async function verifyToken(token, secret) {
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;
  const payloadBytes = fromBase64Url(payloadB64);
  const sigBytes = fromBase64Url(sigB64);
  const key = await getKey(secret);
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, payloadBytes);
  if (!valid) return null;
  const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
  if (payload.exp < Math.floor(Date.now() / 1e3)) return null;
  return payload;
}
const COOKIE_NAME = "album_token";

export { COOKIE_NAME as C, createToken as c, verifyToken as v };
