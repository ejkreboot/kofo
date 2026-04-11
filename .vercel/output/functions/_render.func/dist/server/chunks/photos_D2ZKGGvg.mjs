import { C as COOKIE_NAME, v as verifyToken } from './auth_D_euESOy.mjs';
import { s as supabase } from './supabase_BlEz0VJe.mjs';

const GET = async ({
  request,
  cookies
}) => {
  const url = new URL(request.url);
  const albumId = url.searchParams.get("albumId");
  if (!albumId) {
    return new Response(JSON.stringify({
      error: "Missing albumId"
    }), {
      status: 400
    });
  }
  const token = cookies.get(COOKIE_NAME)?.value;
  const secret = "d090170a-4fe9-4b71-9265-d36b3eff5829";
  if (!token || !secret) {
    return new Response(JSON.stringify({
      error: "Unauthorized"
    }), {
      status: 401
    });
  }
  const payload = await verifyToken(token, secret);
  if (!payload || payload.albumId !== albumId) {
    return new Response(JSON.stringify({
      error: "Unauthorized"
    }), {
      status: 401
    });
  }
  const {
    data: files,
    error
  } = await supabase.storage.from(payload.bucketId).list("", {
    limit: 500,
    sortBy: {
      column: "name",
      order: "asc"
    }
  });
  if (error) {
    return new Response(JSON.stringify({
      error: "Failed to list photos"
    }), {
      status: 500
    });
  }
  const imageFiles = (files ?? []).filter((f) => !f.id?.startsWith(".") && f.name !== ".emptyFolderPlaceholder");
  const SIGNED_URL_EXPIRY = 60 * 60 * 4;
  const {
    data: signedThumb,
    error: thumbErr
  } = await supabase.storage.from(payload.bucketId).createSignedUrls(imageFiles.map((f) => f.name), SIGNED_URL_EXPIRY, {
    transform: {
      width: 250,
      height: 250,
      resize: "cover",
      quality: 75
    }
  });
  if (thumbErr || !signedThumb) {
    return new Response(JSON.stringify({
      error: "Failed to generate URLs"
    }), {
      status: 500
    });
  }
  const {
    data: signedFull,
    error: signErr
  } = await supabase.storage.from(payload.bucketId).createSignedUrls(imageFiles.map((f) => f.name), SIGNED_URL_EXPIRY);
  if (signErr || !signedFull) {
    return new Response(JSON.stringify({
      error: "Failed to generate URLs"
    }), {
      status: 500
    });
  }
  const photos = imageFiles.map((f, i) => ({
    name: f.name,
    thumb: signedThumb[i].signedUrl,
    full: signedFull[i].signedUrl
  }));
  return new Response(JSON.stringify({
    photos,
    albumName: payload.albumName
  }), {
    status: 200
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
