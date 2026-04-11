import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";
import { createToken, COOKIE_NAME } from "../../lib/auth";

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await request.json().catch(() => null);

  // Support lookup by albumId (UUID) or albumName (string)
  const hasId = !!body?.albumId;
  const hasName = !!body?.albumName;
  if ((!hasId && !hasName) || !body?.password) {
    return new Response(JSON.stringify({ error: "Missing album identifier or password" }), { status: 400 });
  }

  let data, error;

  if (hasId) {
    ({ data, error } = await supabase.rpc("verify_album_password", {
      p_album_id: body.albumId,
      p_password: body.password,
    }));
  } else {
    ({ data, error } = await supabase.rpc("verify_album_password_by_name", {
      p_album_name: body.albumName,
      p_password: body.password,
    }));
  }

  if (error || !data || data.length === 0) {
    const detail = error
      ? `RPC error: ${error.message}`
      : !data
        ? "No data returned"
        : "No matching album (wrong name or password)";
    console.error("Auth failed:", detail, { error, dataLength: data?.length });
    return new Response(
      JSON.stringify({ error: "Invalid album name or password", detail }),
      { status: 401 },
    );
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

  return new Response(JSON.stringify({ success: true, albumId: album.id, albumName: album.name }), { status: 200 });
};
