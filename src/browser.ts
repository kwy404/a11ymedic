import { launcher, overlay, toggleOverlay } from "./overlay";
import type { Lang } from "./types";

export * from "./index";
export { overlay, drawPins, toggleOverlay, launcher, printReport } from "./overlay";
export type { OverlayOptions, OverlayController, LauncherController, PrintReportOptions, PinsController } from "./overlay";

declare const document: Document | undefined;

// <script src=".../a11ymedic.js" data-overlay></script> starts the overlay on load
// (data-overlay="pt" for Portuguese). data-button adds a floating "Check this page" button instead.
// Alt+Shift+A toggles the overlay on any page that loads the script.
if (typeof document !== "undefined") {
  const script = document.currentScript as HTMLScriptElement | null;
  const auto = script?.hasAttribute("data-overlay");
  const button = script?.hasAttribute("data-button");
  const value = script?.getAttribute("data-overlay") || script?.getAttribute("data-button") || "";
  const lang: Lang | undefined = /^pt/i.test(value) ? "pt" : /^en/i.test(value) ? "en" : undefined;
  const opts = lang ? { lang } : {};
  const start = (): void => {
    if (auto) overlay(opts);
    else if (button) launcher(opts);
  };
  if (auto || button) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
  }
  // Bind the shortcut once, even when the script is loaded twice.
  const flagged = document.documentElement as HTMLElement & { a11ymedicKeys?: boolean };
  if (!flagged.a11ymedicKeys) {
    flagged.a11ymedicKeys = true;
    document.addEventListener("keydown", (e) => {
      if (e.altKey && e.shiftKey && (e.key === "A" || e.key === "a" || e.code === "KeyA")) {
        e.preventDefault();
        toggleOverlay(opts);
      }
    });
  }
}
