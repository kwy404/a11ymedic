import { overlay, toggleOverlay } from "./overlay";
import type { Lang } from "./types";

export * from "./index";
export { overlay, drawPins, toggleOverlay } from "./overlay";

declare const document: Document | undefined;

// <script src=".../a11ymedic.js" data-overlay></script> starts the overlay on load
// (data-overlay="pt" for Portuguese). Alt+Shift+A toggles it on any page that loads the script.
if (typeof document !== "undefined") {
  const script = document.currentScript as HTMLScriptElement | null;
  const auto = script?.hasAttribute("data-overlay");
  const value = script?.getAttribute("data-overlay") ?? "";
  const lang: Lang | undefined = /^pt/i.test(value) ? "pt" : /^en/i.test(value) ? "en" : undefined;
  const start = (): void => {
    overlay(lang ? { lang } : {});
  };
  if (auto) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
  }
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.shiftKey && (e.key === "A" || e.key === "a" || e.code === "KeyA")) {
      e.preventDefault();
      toggleOverlay(lang ? { lang } : {});
    }
  });
}
