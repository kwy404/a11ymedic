// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { drawPins, launcher, overlay, printReport, toggleOverlay } from "../src/overlay";
import { auditDocument } from "../src/index";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.lang = "en";
  document.head.innerHTML = "<title>Overlay test</title>";
  document.body.innerHTML = `<main><h1>Shop</h1><img id="pic" src="team.jpg"><button id="b"><svg></svg></button><p style="color:#bbb">Faded</p></main>`;
});

afterEach(() => {
  document.getElementById("a11ymedic-overlay")?.remove();
  document.getElementById("a11ymedic-pins")?.remove();
  document.getElementById("a11ymedic-launcher")?.remove();
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
    expect(panel().querySelector("[role=status]")!.textContent).toBe("3 problems. Health score 69 out of 100: Unwell");
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

describe("overlay score and history", () => {
  it("shows the health score as a named ring with its grade", () => {
    const ctl = overlay();
    const ring = panel().querySelector(".ring")!;
    expect(ring.getAttribute("role")).toBe("img");
    expect(ring.getAttribute("aria-label")).toBe("Health score 69 out of 100: Unwell");
    expect(panel().querySelector(".score")!.classList.contains("g-unwell")).toBe(true);
    expect(panel().querySelector(".grade")!.textContent).toBe("Unwell");
    expect(panel().querySelector(".trend")!.textContent).toContain("First check-up of this page");
    expect(panel().querySelector(".spark")).toBeNull();
    ctl.close();
  });

  it("keeps the history locally and shows the change after a fix", () => {
    const ctl = overlay();
    document.getElementById("pic")!.setAttribute("alt", "Our team");
    ctl.refresh();
    expect(ctl.result.score).toBe(81);
    expect(panel().querySelector(".trend.up")!.textContent).toMatch(/^Up 12 points since the check on /);
    expect(panel().querySelector(".spark")!.getAttribute("aria-label")).toBe("Score history, oldest first: 69, 81");
    document.getElementById("b")!.remove();
    ctl.refresh();
    document.body.insertAdjacentHTML("beforeend", '<img src="x.png">');
    ctl.refresh();
    expect(panel().querySelector(".trend.down")!.textContent).toMatch(/^Down 12 points/);
    ctl.close();
    const saved = JSON.parse(localStorage.getItem(`a11ymedic:history:${location.origin}${location.pathname}`)!);
    expect(saved.map((e: { score: number }) => e.score)).toEqual([69, 81, 93, 81]);
    // Opening again on an unchanged page keeps one entry and compares with the one before.
    const again = overlay();
    expect(panel().querySelector(".trend.down")).not.toBeNull();
    again.close();
    expect(JSON.parse(localStorage.getItem(`a11ymedic:history:${location.origin}${location.pathname}`)!)).toHaveLength(4);
  });

  it("can run without history", () => {
    const ctl = overlay({ history: false });
    expect(panel().querySelector(".trend")).toBeNull();
    expect(localStorage.length).toBe(0);
    ctl.close();
  });

  it("animates the panel and ring only when they appear", () => {
    const ctl = overlay();
    expect(panel().querySelector("aside")!.classList.contains("enter")).toBe(true);
    expect(panel().querySelector(".ring")!.classList.contains("enter")).toBe(true);
    ctl.select(0);
    expect(panel().querySelector("aside")!.classList.contains("enter")).toBe(false);
    expect(panel().querySelector(".ring")!.classList.contains("enter")).toBe(false);
    ctl.refresh();
    expect(panel().querySelector(".ring")!.classList.contains("enter")).toBe(true);
    const css = panel().querySelector("style")!.textContent!;
    expect(css).toMatch(/@media \(prefers-reduced-motion:no-preference\)\{\n\.panel\.enter\{animation/);
    ctl.close();
  });
});

describe("printable report from the page", () => {
  type FakeTab = { document: { open(): void; write(s: string): void; close(): void }; focus(): void; print(): void };
  const fakeTab = (): FakeTab & { html: string; printed: number } => {
    const tab = {
      html: "",
      printed: 0,
      document: {
        open: () => {},
        write: (s: string) => {
          tab.html += s;
        },
        close: () => {},
      },
      focus: () => {},
      print: () => {
        tab.printed++;
      },
    };
    return tab;
  };

  it("opens the report in a new tab and starts printing", () => {
    const tab = fakeTab();
    const original = window.open;
    window.open = (() => tab) as unknown as typeof window.open;
    try {
      const ctl = overlay();
      panel().querySelector<HTMLButtonElement>("[data-act=print]")!.click();
      expect(tab.printed).toBe(1);
      expect(tab.html).toContain("<h1>Accessibility report</h1>");
      expect(tab.html).toContain("Health score 69 out of 100: Unwell");
      expect(tab.html).toContain(location.href);
      expect(tab.html).toContain("Image without alt text");
      ctl.close();
    } finally {
      window.open = original;
    }
  });

  it("saves the report as a file when the new tab is blocked", () => {
    const original = window.open;
    const created = URL.createObjectURL;
    const clicks: string[] = [];
    window.open = (() => null) as unknown as typeof window.open;
    URL.createObjectURL = () => "blob:report";
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      clicks.push(`${this.download} ${this.href}`);
    };
    try {
      const ctl = overlay({ lang: "pt" });
      const button = panel().querySelector<HTMLButtonElement>("[data-act=print]")!;
      expect(button.textContent).toBe("Imprimir relatório");
      button.click();
      expect(button.textContent).toBe("Relatório salvo como arquivo");
      expect(clicks).toHaveLength(1);
      expect(clicks[0]).toMatch(/^a11ymedic-report-\d{4}-\d{2}-\d{2}\.html blob:report$/);
      expect(document.querySelector("a[download]")).toBeNull();
      expect(printReport(ctl.result)).toBe("downloaded");
      ctl.close();
    } finally {
      window.open = original;
      URL.createObjectURL = created;
      HTMLAnchorElement.prototype.click = click;
    }
  });
});

describe("check this page button", () => {
  const button = (): HTMLButtonElement => document.getElementById("a11ymedic-launcher")!.shadowRoot!.querySelector("button")!;

  it("adds a labelled floating button that opens the overlay and comes back after closing", () => {
    const ctl = launcher();
    expect(button().textContent).toBe("Check this page");
    expect(button().type).toBe("button");
    button().click();
    expect(button().hidden).toBe(true);
    expect(document.getElementById("a11ymedic-overlay")).not.toBeNull();
    panel().querySelector<HTMLButtonElement>("[data-act=close]")!.click();
    expect(document.getElementById("a11ymedic-overlay")).toBeNull();
    expect(button().hidden).toBe(false);
    expect(document.activeElement).toBe(document.getElementById("a11ymedic-launcher"));
    ctl.remove();
    expect(document.getElementById("a11ymedic-launcher")).toBeNull();
  });

  it("speaks Portuguese on Portuguese pages and is not part of the audit", () => {
    document.documentElement.lang = "pt-BR";
    launcher();
    expect(button().textContent).toBe("Verificar esta página");
    expect(auditDocument(document).findings).toHaveLength(3);
    const css = document.getElementById("a11ymedic-launcher")!.shadowRoot!.querySelector("style")!.textContent!;
    expect(css).toContain("min-height:44px");
    expect(css).toContain("@media (prefers-reduced-motion:no-preference)");
  });

  it("toggles an overlay opened by another copy of the script", () => {
    overlay();
    // A second copy only sees the page, not this module's state.
    const host = document.getElementById("a11ymedic-overlay") as HTMLElement & { a11ymedic?: { close(): void } };
    expect(typeof host.a11ymedic?.close).toBe("function");
    expect(toggleOverlay()).toBeNull();
    expect(document.getElementById("a11ymedic-overlay")).toBeNull();
    const first = overlay();
    overlay();
    expect(document.querySelectorAll("#a11ymedic-overlay")).toHaveLength(1);
    first.close();
  });
});
