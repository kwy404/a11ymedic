// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { auditDocument } from "../src/index";
import { ComputedStyles } from "../src/style";

/** Gives elements fixed boxes so layout based rules can run in jsdom. */
function boxes(map: Record<string, [number, number, number, number]>): void {
  for (const [id, [x, y, w, h]] of Object.entries(map)) {
    const el = document.getElementById(id)!;
    el.getBoundingClientRect = () => ({ x, y, left: x, top: y, width: w, height: h, right: x + w, bottom: y + h, toJSON: () => ({}) }) as DOMRect;
  }
}

describe("computed styles mode (browser)", () => {
  it("reads getComputedStyle values", () => {
    document.body.innerHTML = '<p id="p" style="color: rgb(10, 20, 30); opacity: 0.5; font-size: 20px; font-weight: bold; display: block; visibility: visible">x</p>';
    const s = new ComputedStyles(window);
    const p = document.getElementById("p")!;
    expect(s.color(p)).toEqual({ r: 10, g: 20, b: 30, a: 1 });
    expect(s.opacity(p)).toBe(0.5);
    expect(s.fontSize(p)).toBe(20);
    expect(s.fontWeight(p)).toBe(700);
    expect(s.display(p)).toBe("block");
    expect(s.visibility(p)).toBe("visible");
    expect(s.backgroundImage(p)).toBe("none");
    expect(s.rect(p)).toMatchObject({ width: 0, height: 0 });
  });

  it("checks target size with real boxes and the spacing exception", () => {
    document.body.innerHTML = `<main><h1>t</h1>
      <div><button id="a" aria-label="Bold">B</button><button id="b" aria-label="Italic">I</button></div>
      <button id="c" aria-label="Alone">C</button>
      <button id="d">Big enough</button></main>`;
    boxes({ a: [0, 0, 16, 16], b: [18, 0, 16, 16], c: [300, 300, 16, 16], d: [0, 100, 120, 40] });
    const r = auditDocument(document, { styles: "computed", rules: ["target-size"] });
    expect(r.styles).toBe("computed");
    expect(r.findings.map((f) => f.element!.id).sort()).toEqual(["a", "b"]);
    expect(r.findings[0]!.message.en).toContain("16 x 16");
  });

  it("flags crowded small targets next to large ones", () => {
    document.body.innerHTML = '<main><h1>t</h1><button id="s" aria-label="Small">s</button><button id="l">Large button</button></main>';
    boxes({ s: [0, 0, 10, 10], l: [12, 0, 100, 40] });
    const r = auditDocument(document, { styles: "computed", rules: ["target-size"] });
    expect(r.findings.map((f) => f.element!.id)).toEqual(["s"]);
  });

  it("asks for a human check on small isolated targets in static mode", () => {
    document.body.innerHTML = '<style>.t { width: 12px; height: 12px }</style><main><h1>t</h1><button class="t" aria-label="Close">x</button></main>';
    const r = auditDocument(document, { rules: ["target-size"] });
    expect(r.styles).toBe("static");
    expect(r.findings).toHaveLength(0);
    expect(r.incomplete).toHaveLength(1);
  });

  it("does not use the jsdom layout for automatic mode", () => {
    document.body.innerHTML = "<p>x</p>";
    expect(auditDocument(document).styles).toBe("static");
  });
});

describe("jest setup file", () => {
  it("registers the matcher on the global expect", async () => {
    const extend = vi.fn();
    (globalThis as unknown as { expect: unknown }).expect = { extend };
    await import("../src/jest");
    expect(extend).toHaveBeenCalledWith(expect.objectContaining({ toHaveNoViolations: expect.any(Function) }));
    delete (globalThis as unknown as { expect?: unknown }).expect;
  });
});
