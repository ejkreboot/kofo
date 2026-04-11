import { s as supabase } from './supabase_BlEz0VJe.mjs';
import { c as createToken, C as COOKIE_NAME } from './auth_D_euESOy.mjs';

const POST = async ({
  request,
  cookies
}) => {
  const body = await request.json().catch(() => null);
  const hasId = !!body?.albumId;
  const hasName = !!body?.albumName;
  if (!hasId && !hasName || !body?.password) {
    return new Response(JSON.stringify({
      error: "Missing album identifier or password"
    }), {
      status: 400
    });
  }
  let data, error;
  if (hasId) {
    ({
      data,
      error
    } = await supabase.rpc("verify_album_password", {
      p_album_id: body.albumId,
      p_password: body.password
    }));
  } else {
    ({
      data,
      error
    } = await supabase.rpc("verify_album_password_by_name", {
      p_album_name: body.albumName,
      p_password: body.password
    }));
  }
  if (error || !data || data.length === 0) {
    const detail = error ? `RPC error: ${error.message}` : !data ? "No data returned" : "No matching album (wrong name or password)";
    console.error("Auth failed:", detail, {
      error,
      dataLength: data?.length
    });
    return new Response(JSON.stringify({
      error: "Invalid album name or password",
      detail
    }), {
      status: 401
    });
  }
  const album = data[0];
  const secret = "d090170a-4fe9-4b71-9265-d36b3eff5829";
  const token = await createToken({
    albumId: album.id,
    bucketId: album.bucket_id,
    albumName: album.name
  }, secret);
  cookies.set(COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 4
    // 4 hours
  });
  return new Response(JSON.stringify({
    success: true,
    albumId: album.id,
    albumName: album.name
  }), {
    status: 200
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
