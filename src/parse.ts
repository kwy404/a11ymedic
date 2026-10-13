/** Parses HTML into a document. Uses the browser's DOMParser when present, jsdom on Node. */

export interface ParsedHtml {
  document: Document;
  /** 1-based source position of an element, when known. */
  locate: (el: Element) => { line: number; column: number } | null;
  /** Source offsets of an element (Node only), used to patch files. */
  location: (el: Element) => ElementLocation | null;
  /** True when the HTML has no <html>, <head>, <body> or doctype: a component fragment. */
  fragment: boolean;
}

export interface ElementLocation {
  startOffset: number;
  endOffset: number;
  startTag?: { startOffset: number; endOffset: number; attrs?: Record<string, { startOffset: number; endOffset: number }> };
  endTag?: { startOffset: number; endOffset: number };
  startLine: number;
  startCol: number;
}

export const isFragment = (html: string): boolean => !/<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i.test(html);

interface JsdomModule {
  JSDOM: new (
    html: string,
    options: { includeNodeLocations?: boolean; url?: string },
  ) => { window: Window & typeof globalThis; nodeLocation(node: Node): ElementLocation | null };
}

let jsdomPromise: Promise<JsdomModule> | null = null;

export async function parseHtml(html: string, options: { url?: string } = {}): Promise<ParsedHtml> {
  const fragment = isFragment(html);
  const g = globalThis as unknown as { DOMParser?: typeof DOMParser; process?: { versions?: { node?: string } } };
  if (typeof g.DOMParser === "function" && !g.process?.versions?.node) {
    const document = new g.DOMParser().parseFromString(html, "text/html");
    return { document, locate: () => null, location: () => null, fragment };
  }
  // A variable specifier keeps bundlers from pulling jsdom into the browser build.
  const specifier = "jsdom";
  jsdomPromise ??= import(specifier) as unknown as Promise<JsdomModule>;
  const mod = await jsdomPromise;
  const JSDOM = mod.JSDOM ?? (mod as unknown as { default: JsdomModule }).default.JSDOM;
  const dom = new JSDOM(html, { includeNodeLocations: true, ...(options.url ? { url: options.url } : {}) });
  const location = (el: Element): ElementLocation | null => {
    try {
      return dom.nodeLocation(el) ?? null;
    } catch {
      return null;
    }
  };
  return {
    document: dom.window.document,
    locate: (el) => {
      const loc = location(el);
      return loc ? { line: loc.startLine, column: loc.startCol } : null;
    },
    location,
    fragment,
  };
}
