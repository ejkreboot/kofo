import { c as createComponent } from './astro-component_CnPl_Uqv.mjs';
import 'piccolore';
import { b9 as renderHead, a4 as addAttribute, T as renderTemplate } from './sequence_jkwZ4rKh.mjs';
import 'clsx';
import { r as renderScript } from './script_CzrHCzjw.mjs';

const $$Gallery = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Gallery;
  const album = Astro2.locals.album;
  if (!album) {
    return Astro2.redirect(`/${Astro2.params.albumId}`);
  }
  const { albumId, albumName } = album;
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${albumName}</title><link rel="stylesheet" href="/styles/global.css">${renderHead()}</head> <body> <div id="gallery-root"${addAttribute(albumId, "data-album-id")}${addAttribute(albumName, "data-album-name")}></div> ${renderScript($$result, "/Users/erikor/kofo/src/pages/[albumId]/gallery.astro?astro&type=script&index=0&lang.ts")} </body> </html>`;
}, "/Users/erikor/kofo/src/pages/[albumId]/gallery.astro", void 0);

const $$file = "/Users/erikor/kofo/src/pages/[albumId]/gallery.astro";
const $$url = "/[albumId]/gallery";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Gallery,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
