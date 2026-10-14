// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { drawPins, overlay, toggleOverlay } from "../src/overlay";
import { auditDocument } from "../src/index";

beforeEach(() => {
  document.documentElement.lang = "en";
  document.head.innerHTML = "<title>Overlay test</title>";
  document.body.innerHTML = `<main><h1>Shop</h1><img id="pic" src="team.jpg"><button id="b"><svg></svg></button><p style="color:#bbb">Faded</p></main>`;
});

afterEach(() => {
  document.getElementById("a11ymedic-overlay")?.remove();
  document.getElementById("a11ymedic-pins")?.remove();
});

const panel = (): ShadowRoot => document.getElementById("a11ymedic-overlay")!.shadowRoot!;

describe("overlay", () => {
  it("audits the page and lists every finding in a labelled side panel", () => {
    const ctl = overlay();
    expect(ctl.result.findings.map((f) => f.rule).sort()).toEqual(["button-name", "color-contrast", "image-alt"]);
    const aside = panel().querySelector("aside")!;
    expect(aside.getAttribute("aria-labelledby")).toBe("a11ymedic-title");
    expect(panel().querySelector("h2")!.textContent).toContain("3 problems");
    expect(panel().querySelectorAll(".item")).toHaveLength(3);
    expect(panel().querySelector("[role=status]")!.textContent).toBe("3 problems");
    ctl.close();
  });

  it("does not audit itself", () => {
    const ctl = overlay();
    const again = ctl.refresh();
    expect(again.findings).toHaveLength(3);
    expect(auditDocument(document).findings).toHaveLength(3);
    ctl.close();
  });

  it("draws one numbered pin button per element", () => {
    const ctl = overlay();
    const pins = document.getElementById("a11ymedic-pins")!.shadowRoot!.querySelectorAll("button.pin");
    expect(pins).toHaveLength(3);
    expect(pins[0]!.getAttribute("aria-label")).toMatch(/^Problem \d: /);
    ctl.close();
    expect(document.getElementById("a11ymedic-pins")).toBeNull();
  });

  it("expands a finding with its explanation and before and after code", () => {
    const ctl = overlay();
    const i = ctl.result.findings.findIndex((f) => f.rule === "image-alt");
    const head = panel().querySelector<HTMLButtonElement>(`.head[data-i="${i}"]`)!;
    expect(head.getAttribute("aria-expanded")).toBe("false");
    head.click();
    const opened = panel().querySelector<HTMLButtonElement>(`.head[data-i="${i}"]`)!;
    expect(opened.getAttribute("aria-expanded")).toBe("true");
    const body = panel().getElementById(`b${i}`)!;
    expect(body.hidden).toBe(false);
    expect(body.textContent).toContain("Why it matters");
    expect(body.querySelector(".after")!.textContent).toBe('<img id="pic" src="team.jpg" alt="Team">');
    ctl.select(i);
    expect(panel().getElementById(`b${i}`)!.hidden).toBe(true);
    ctl.close();
  });

  it("selects a finding from a pin", () => {
    const ctl = overlay();
    const pin = document.getElementById("a11ymedic-pins")!.shadowRoot!.querySelector<HTMLButtonElement>("button.pin")!;
    pin.click();
    expect(panel().querySelectorAll(".item.on")).toHaveLength(1);
    ctl.close();
  });

  it("switches language, runs again and closes with the buttons", () => {
    const ctl = overlay({ lang: "en" });
    panel().querySelector<HTMLButtonElement>("[data-act=lang]")!.click();
    expect(panel().querySelector("h2")!.textContent).toContain("Consulta a11ymedic");
    expect(panel().querySelector(".item .t")!.textContent).toMatch(/[ãçéíóú]|Botão|Imagem|Texto/);
    document.getElementById("pic")!.setAttribute("alt", "Our team");
    panel().querySelector<HTMLButtonElement>("[data-act=rerun]")!.click();
    expect(ctl.result.findings).toHaveLength(2);
    panel().querySelector<HTMLButtonElement>("[data-act=close]")!.click();
    expect(document.getElementById("a11ymedic-overlay")).toBeNull();
  });

  it("closes on Escape from inside the panel", () => {
    overlay();
    const h2 = panel().querySelector("h2")!;
    h2.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true }));
    expect(document.getElementById("a11ymedic-overlay")).toBeNull();
  });

  it("toggles", () => {
    expect(toggleOverlay()).not.toBeNull();
    expect(toggleOverlay()).toBeNull();
    expect(document.getElementById("a11ymedic-overlay")).toBeNull();
  });

  it("shows a healthy state", () => {
    document.body.innerHTML = "<main><h1>All good</h1></main>";
    const ctl = overlay({ lang: "pt" });
    expect(panel().querySelector(".empty")!.textContent).toContain("Saudável");
    ctl.close();
  });

  it("drawPins skips elements without a box and can highlight", () => {
    const result = auditDocument(document);
    const pins = drawPins(document, result.findings, { lang: "pt" });
    const root = document.getElementById("a11ymedic-pins")!.shadowRoot!;
    expect(root.querySelector("button.pin")!.getAttribute("aria-label")).toMatch(/^Problema /);
    pins.highlight(0);
    pins.update();
    pins.highlight(null);
    pins.remove();
    expect(document.getElementById("a11ymedic-pins")).toBeNull();
  });
});
