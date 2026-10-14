import { describe, expect, it } from "vitest";
import { accessibleName, getRole } from "../src/index";
import { parseHtml } from "../src/parse";

async function nameOf(html: string, selector = "#t"): Promise<string> {
  const { document } = await parseHtml(`<!doctype html><html lang="en"><body>${html}</body></html>`);
  return accessibleName(document.querySelector(selector)!);
}

async function roleOf(html: string, selector = "#t"): Promise<string> {
  const { document } = await parseHtml(`<!doctype html><html lang="en"><body>${html}</body></html>`);
  return getRole(document.querySelector(selector)!);
}

describe("accessible name computation", () => {
  it.each([
    ["button text", '<button id="t">Save draft</button>', "Save draft"],
    ["nested inline text", '<button id="t">Save <b>draft</b></button>', "Save draft"],
    ["aria-label wins over content", '<button id="t" aria-label="Close dialog">X</button>', "Close dialog"],
    ["aria-labelledby wins over aria-label", '<span id="l">Billing</span><button id="t" aria-label="x" aria-labelledby="l">?</button>', "Billing"],
    ["aria-labelledby with several ids", '<span id="a">Delete</span><span id="b">invoice 42</span><button id="t" aria-labelledby="a b">X</button>', "Delete invoice 42"],
    ["aria-labelledby referencing itself", '<span id="x">Remove</span><button id="t" aria-labelledby="x t">file.txt</button>', "Remove file.txt"],
    ["aria-labelledby to hidden text", '<span id="h" hidden>Secret label</span><button id="t" aria-labelledby="h">?</button>', "Secret label"],
    ["missing labelledby target falls through", '<button id="t" aria-labelledby="nope">Fallback</button>', "Fallback"],
    ["empty aria-label is ignored", '<button id="t" aria-label="  ">Text</button>', "Text"],
    ["image alt", '<img id="t" src="a.png" alt="Company logo">', "Company logo"],
    ["empty alt", '<img id="t" src="a.png" alt="">', ""],
    ["img inside a link", '<a id="t" href="/"><img src="home.png" alt="Home"></a>', "Home"],
    ["link with text and image", '<a id="t" href="/"><img src="i.png" alt="Shop"> now</a>', "Shop now"],
    ["label for", '<label for="t">Email address</label><input id="t">', "Email address"],
    ["wrapping label", '<label>Name <input id="t"></label>', "Name"],
    ["two labels", '<label for="t">First</label><label for="t">Second</label><input id="t">', "First Second"],
    ["label with embedded select", '<label>Ship in <select><option>2 days</option><option selected>5 days</option></select><input id="t" type="checkbox"></label>', "Ship in 5 days"],
    ["label with embedded textbox value", '<label for="t">Pay <input value="10"> dollars</label><input id="t" type="checkbox">', "Pay 10 dollars"],
    ["title as last resort", '<input id="t" title="Search the site">', "Search the site"],
    ["placeholder as last resort", '<input id="t" placeholder="Search">', "Search"],
    ["submit default", '<input id="t" type="submit">', "Submit"],
    ["reset default", '<input id="t" type="reset">', "Reset"],
    ["button value", '<input id="t" type="button" value="Go">', "Go"],
    ["input image alt", '<input id="t" type="image" alt="Search">', "Search"],
    ["fieldset legend", '<fieldset id="t"><legend>Shipping</legend><input></fieldset>', "Shipping"],
    ["table caption", '<table id="t"><caption>Prices</caption><tr><td>1</td></tr></table>', "Prices"],
    ["figure figcaption", '<figure id="t"><img src="a.png" alt=""><figcaption>Chart of sales</figcaption></figure>', "Chart of sales"],
    ["svg title", '<svg id="t" role="img"><title>Warning</title></svg>', "Warning"],
    ["aria-hidden content is skipped", '<button id="t"><span aria-hidden="true">X</span> Close</button>', "Close"],
    ["display none content is skipped", '<button id="t"><span style="display:none">hidden</span>Visible</button>', "Visible"],
    ["visually hidden text counts", '<button id="t"><svg aria-hidden="true"></svg><span class="sr-only">Menu</span></button>', "Menu"],
    ["block children are separated by spaces", '<a id="t" href="/"><div>New</div><div>Arrivals</div></a>', "New Arrivals"],
    ["br separates words", '<button id="t">Sign<br>in</button>', "Sign in"],
    ["headings take their content", '<h2 id="t">Our <em>plans</em></h2>', "Our plans"],
    ["div has no name from content", '<div id="t">Text</div>', ""],
    ["presentation role has no name", '<img id="t" role="presentation" alt="x">', ""],
    ["whitespace is collapsed", '<button id="t">  Add\n\n   to   cart </button>', "Add to cart"],
    ["optgroup label", '<select><optgroup id="t" label="Fruits"><option>Apple</option></optgroup></select>', "Fruits"],
  ])("%s", async (_name, html, expected) => {
    expect(await nameOf(html)).toBe(expected);
  });

  it("hidden elements have no name unless referenced", async () => {
    expect(await nameOf('<button id="t" style="display:none">Hidden</button>')).toBe("");
  });

  it("does not loop on circular references", async () => {
    expect(await nameOf('<span id="a" aria-labelledby="t">A</span><button id="t" aria-labelledby="a">B</button>')).toBe("A");
  });
});

describe("roles", () => {
  it.each([
    ['<a id="t" href="/">x</a>', "link"],
    ['<a id="t">x</a>', "generic"],
    ['<button id="t">x</button>', "button"],
    ['<input id="t">', "textbox"],
    ['<input id="t" type="checkbox">', "checkbox"],
    ['<input id="t" type="radio">', "radio"],
    ['<input id="t" type="range">', "slider"],
    ['<input id="t" type="number">', "spinbutton"],
    ['<input id="t" type="search">', "searchbox"],
    ['<input id="t" list="l"><datalist id="l"></datalist>', "combobox"],
    ['<input id="t" type="submit">', "button"],
    ['<select id="t"></select>', "combobox"],
    ['<select id="t" multiple></select>', "listbox"],
    ['<textarea id="t"></textarea>', "textbox"],
    ['<img id="t" src="a.png" alt="">', "presentation"],
    ['<img id="t" src="a.png" alt="x">', "img"],
    ['<h3 id="t">x</h3>', "heading"],
    ['<nav id="t"></nav>', "navigation"],
    ['<main id="t"></main>', "main"],
    ['<header id="t"></header>', "banner"],
    ['<article><header id="t"></header></article>', "generic"],
    ['<footer id="t"></footer>', "contentinfo"],
    ['<section id="t"></section>', "generic"],
    ['<section id="t" aria-label="News"></section>', "region"],
    ['<ul id="t"></ul>', "list"],
    ['<li id="t"></li>', "listitem"],
    ['<table><tr><th id="t">A</th><th>B</th></tr></table>', "columnheader"],
    ['<table><tr><th id="t">A</th><td>B</td></tr></table>', "rowheader"],
    ['<table><tr><th id="t" scope="row">A</th></tr></table>', "rowheader"],
    ['<div id="t" role="button">x</div>', "button"],
    ['<div id="t" role="foo button">x</div>', "button"],
    ['<div id="t" role="foo">x</div>', "generic"],
    ['<button id="t" role="presentation">x</button>', "button"],
    ['<dialog id="t"></dialog>', "dialog"],
    ['<details><summary id="t">More</summary></details>', "button"],
    ['<progress id="t"></progress>', "progressbar"],
    ['<hr id="t">', "separator"],
  ])("%s is %s", async (html, role) => {
    expect(await roleOf(html)).toBe(role);
  });
});
