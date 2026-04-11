import { s as supabase } from './supabase_BlEz0VJe.mjs';
import { c as createToken, C as COOKIE_NAME } from './auth_D_euESOy.mjs';

const POST = async ({
  request,
  cookies
}) => {
  const body = await request.json().catch(() => null);
  if (!body?.albumId || !body?.password) {
    return new Response(JSON.stringify({
      error: "Missing albumId or password"
    }), {
      status: 400
    });
  }
  const {
    data,
    error
  } = await supabase.rpc("verify_album_password", {
    p_album_id: body.albumId,
    p_password: body.password
  });
  if (error || !data || data.length === 0) {
    return new Response(JSON.stringify({
      error: "Invalid password"
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
