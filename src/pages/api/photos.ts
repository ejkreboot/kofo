import type { APIRoute } from "astro";
import { verifyToken, COOKIE_NAME } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request, cookies }) => {
  const url = new URL(request.url);
  const albumId = url.searchParams.get("albumId");

  if (!albumId) {
    return new Response(JSON.stringify({ error: "Missing albumId" }), { status: 400 });
  }

  const token = cookies.get(COOKIE_NAME)?.value;
  const secret = import.meta.env.ALBUM_TOKEN_SECRET;

  if (!token || !secret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const payload = await verifyToken(token, secret);
  if (!payload || payload.albumId !== albumId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { data: files, error } = await supabase.storage.from(payload.bucketId).list("", {
    limit: 500,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) {
    return new Response(JSON.stringify({ error: "Failed to list photos" }), { status: 500 });
  }

  const imageFiles = (files ?? []).filter(
    (f) => !f.id?.startsWith(".") && f.name !== ".emptyFolderPlaceholder",
  );

  const SIGNED_URL_EXPIRY = 60 * 60 * 4; // 4 hours

  // Generate signed URLs for full-res images
  const { data: signedFull, error: signErr } = await supabase.storage
    .from(payload.bucketId)
    .createSignedUrls(
      imageFiles.map((f) => f.name),
      SIGNED_URL_EXPIRY,
    );

  if (signErr || !signedFull) {
    return new Response(JSON.stringify({ error: "Failed to generate URLs" }), { status: 500 });
  }

  // Generate signed URLs for thumbnails (with image transform)
  const { data: signedThumb, error: thumbErr } = await supabase.storage
    .from(payload.bucketId)
    .createSignedUrls(
      imageFiles.map((f) => f.name),
      SIGNED_URL_EXPIRY,
      { transform: { width: 400, height: 400, resize: "cover" } },
    );

  if (thumbErr || !signedThumb) {
    return new Response(JSON.stringify({ error: "Failed to generate URLs" }), { status: 500 });
  }

  const photos = imageFiles.map((f, i) => ({
    name: f.name,
    thumb: signedThumb[i].signedUrl,
    full: signedFull[i].signedUrl,
  }));

  return new Response(JSON.stringify({ photos, albumName: payload.albumName }), { status: 200 });
};
