import type { Lang } from "./types";
import { VERSION } from "./version";

export interface BookmarkletOptions {
  /** Language of the panel. Default: the language of the page. */
  lang?: Lang;
  /** Address of the browser build. Default: the jsDelivr copy of this version. */
  src?: string;
}

/** The CDN address of the browser build of this version. */
export const cdnUrl = (version: string = VERSION): string => `https://cdn.jsdelivr.net/npm/a11ymedic@${version}/dist/a11ymedic.js`;

/**
 * A `javascript:` URL for a bookmark that checks the page you are on. Pressing it again closes
 * the panel, and once the script is loaded it is not downloaded again.
 *
 *   bookmarklet({ lang: "pt" }); // "javascript:(function(){...})()"
 */
export function bookmarklet(options: BookmarkletOptions = {}): string {
  const src = options.src ?? cdnUrl();
  if (/['\\\n\r]/.test(src)) throw new Error("a11ymedic: the bookmarklet src cannot contain quotes, backslashes or line breaks.");
  const lang = options.lang === "pt" || options.lang === "en" ? options.lang : "";
  const opts = lang ? `{lang:'${lang}'}` : "{}";
  const code =
    `(function(){var a=window.a11ymedic;if(a&&a.toggleOverlay){a.toggleOverlay(${opts});return}` +
    `var s=document.createElement('script');s.src='${src}';s.setAttribute('data-overlay','${lang}');` +
    `s.onerror=function(){alert('a11ymedic could not load. The page may block outside scripts (Content Security Policy).')};` +
    `document.body.appendChild(s)})()`;
  return `javascript:${code.replace(/ /g, "%20")}`;
}
