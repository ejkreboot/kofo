import { c as createComponent } from './astro-component_CnPl_Uqv.mjs';
import 'piccolore';
import { b9 as renderHead, a4 as addAttribute, T as renderTemplate } from './sequence_jkwZ4rKh.mjs';
import 'clsx';
import { r as renderScript } from './script_CzrHCzjw.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Index;
  const { albumId } = Astro2.params;
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Kort Amateur Photography</title><link rel="stylesheet" href="/styles/global.css">${renderHead()}</head> <body> <main class="password-page"> <div class="password-card"> <img src="/logo.png" alt="Kort Amateur Photography" class="logo-landing"> <div class="brand">Kort Amateur Photography</div> <h1>View Album</h1> <p class="subtitle">Enter the password to access this gallery</p> <form id="pw-form"> <input type="hidden" name="albumId"${addAttribute(albumId, "value")}> <input type="password" name="password" placeholder="Album password" autocomplete="current-password" required> <button type="submit"> <span class="btn-text">Continue</span> <span class="btn-loading" hidden> <svg class="spinner" width="20" height="20" viewBox="0 0 24 24"> <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10"></circle> </svg> </span> </button> <p class="error" id="pw-error" hidden></p> </form> </div> </main> ${renderScript($$result, "/Users/erikor/kofo/src/pages/[albumId]/index.astro?astro&type=script&index=0&lang.ts")} </body> </html>`;
}, "/Users/erikor/kofo/src/pages/[albumId]/index.astro", void 0);

const $$file = "/Users/erikor/kofo/src/pages/[albumId]/index.astro";
const $$url = "/[albumId]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
