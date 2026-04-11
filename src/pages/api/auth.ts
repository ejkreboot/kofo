import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";
import { createToken, COOKIE_NAME } from "../../lib/auth";

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await request.json().catch(() => null);
  if (!body?.albumId || !body?.password) {
    return new Response(JSON.stringify({ error: "Missing albumId or password" }), { status: 400 });
  }

  const { data, error } = await supabase.rpc("verify_album_password", {
    p_album_id: body.albumId,
    p_password: body.password,
  });

  if (error || !data || data.length === 0) {
    return new Response(JSON.stringify({ error: "Invalid password" }), { status: 401 });
  }

  const album = data[0];
  const secret = import.meta.env.ALBUM_TOKEN_SECRET;

  const token = await createToken(
    { albumId: album.id, bucketId: album.bucket_id, albumName: album.name },
    secret,
  );

  cookies.set(COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    maxAge: 60 * 60 * 4, // 4 hours
  });

  return new Response(JSON.stringify({ success: true, albumName: album.name }), { status: 200 });
};
