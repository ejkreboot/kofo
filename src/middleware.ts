import { defineMiddleware } from "astro:middleware";
import { verifyToken, COOKIE_NAME } from "./lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const segments = url.pathname.split("/").filter(Boolean);

  // Only protect /:albumId/gallery routes
  if (segments.length >= 2 && segments[1] === "gallery") {
    const albumId = segments[0];
    const token = context.cookies.get(COOKIE_NAME)?.value;
    const secret = import.meta.env.ALBUM_TOKEN_SECRET;

    if (!token || !secret) {
      return context.redirect(`/${albumId}`);
    }

    const payload = await verifyToken(token, secret);
    if (!payload || payload.albumId !== albumId) {
      return context.redirect(`/${albumId}`);
    }

    context.locals.album = payload;
  }

  return next();
});
