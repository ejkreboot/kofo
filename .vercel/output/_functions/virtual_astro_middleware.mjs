import { a8 as defineMiddleware, ah as sequence } from './chunks/sequence_jkwZ4rKh.mjs';
import 'piccolore';
import 'clsx';
import { C as COOKIE_NAME, v as verifyToken } from './chunks/auth_D_euESOy.mjs';

const onRequest$1 = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length >= 2 && segments[1] === "gallery") {
    const albumId = segments[0];
    const token = context.cookies.get(COOKIE_NAME)?.value;
    const secret = "d090170a-4fe9-4b71-9265-d36b3eff5829";
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

const onRequest = sequence(
	
	onRequest$1
	
);

export { onRequest };
