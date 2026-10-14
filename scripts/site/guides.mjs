// Long form guides for the a11ymedic site. Each body is HTML; code samples are HTML escaped.

export const GUIDES = [
  {
    slug: "website-accessibility-checker",
    title: "Website Accessibility Checker: Free WCAG 2.2 Audit",
    h1: "A website accessibility checker that explains every fix",
    description:
      "Check any website for WCAG 2.2 accessibility problems in the browser, the terminal or your tests, with a plain language explanation and the exact fix for each.",
    keywords:
      "website accessibility checker, accessibility checker, wcag checker, accessibility audit, wcag 2.2, a11y checker, free accessibility test",
    lead:
      "A website accessibility checker reads your HTML and CSS and reports the barriers it can prove: images without text, low contrast, unlabeled fields, broken ARIA and more. a11ymedic runs the same checks in the browser, on the command line and in your tests, and every finding comes with who it affects and the code that fixes it.",
    body: `
<h2 id="what-a-checker-finds">What an accessibility checker can and cannot find</h2>
<p>Automated checks are good at anything that can be decided from the code. An <code>&lt;img&gt;</code> with no <code>alt</code> attribute, a <code>&lt;button&gt;</code> that contains only an SVG, a text color of <code>#999999</code> on white (2.84:1, below the 4.5:1 that WCAG asks for), an <code>&lt;html&gt;</code> element with no <code>lang</code>, a positive <code>tabindex</code>, an <code>aria-expanded</code> with a value of <code>"yes"</code>: all of these are facts, and a checker can find every one of them in milliseconds.</p>
<p>Other questions need judgment. A checker can see that an image has alt text, but not whether "Team" is a good description of a photo that shows a fire exit. It can see that a page has headings, but not whether they describe the sections. Studies of real audits usually find that automated tools catch somewhere between a third and a half of the issues on a typical page. That is still a lot of work saved, because the problems they catch are also the most common ones.</p>
<p>a11ymedic is honest about that line. Every result is either a <strong>finding</strong> (a proven failure with a fix) or an entry in <strong>incomplete</strong>, which means "needs a human check". Text over a background image and target sizes measured without layout land in the second group, so you know exactly what to review by eye.</p>

<h2 id="three-ways">Three ways to check a website</h2>
<p>You can run the same rules in three places. Pick the one that matches what you are doing right now.</p>
<ol>
<li><strong>In the page you are looking at.</strong> Add one script tag. It audits the live page with the real computed styles and element boxes, draws numbered pins on each problem and opens a side panel you can use with the keyboard. Press <strong>Alt+Shift+A</strong> to show or hide it.</li>
<li><strong>From the terminal.</strong> Point the CLI at files, globs, folders or a URL. For a URL it uses Playwright or Puppeteer when one of them is installed, and otherwise fetches the HTML and runs a static check.</li>
<li><strong>From code.</strong> Call <code>audit(html)</code> in Node, inspect the findings, and turn them into a report or a failing test.</li>
</ol>
<pre data-lang="html" data-title="Overlay in any page"><code>&lt;!-- English panel --&gt;
&lt;script src=&quot;https://cdn.jsdelivr.net/npm/a11ymedic@0.1.0/dist/a11ymedic.js&quot; data-overlay&gt;&lt;/script&gt;

&lt;!-- Portuguese panel --&gt;
&lt;script src=&quot;https://cdn.jsdelivr.net/npm/a11ymedic@0.1.0/dist/a11ymedic.js&quot; data-overlay=&quot;pt&quot;&gt;&lt;/script&gt;</code></pre>
<pre data-lang="sh" data-title="Terminal"><code># Local files
npx a11ymedic &quot;src/**/*.html&quot;

# A deployed page, saved as an HTML report
npx a11ymedic https://example.com --format html -o report.html

# Report in Portuguese, including AAA rules
npx a11ymedic index.html --lang pt --level AAA</code></pre>
<p>If you want to try it without installing anything, paste a snippet into the <a href="./#checkup">online check-up</a> on the home page.</p>

<h2 id="reading-a-finding">How to read a finding</h2>
<p>Each finding is written for the person who has to fix it, not for an auditor. It has the same fields in every output format:</p>
<ul>
<li><strong>Severity</strong>: critical, serious, moderate or minor. Critical means some people cannot use the feature at all, for example a button with no name.</li>
<li><strong>Message</strong>: what is wrong with this exact element, in English and Portuguese.</li>
<li><strong>Explanation and affects</strong>: why it matters and who is hurt by it, such as screen reader users, people with low vision, or people with tremors.</li>
<li><strong>WCAG</strong>: the success criteria it fails, with their level and a link to the official Understanding page.</li>
<li><strong>Location</strong>: a unique CSS selector plus the line and column in your source file.</li>
<li><strong>Fix</strong>: a summary, the element before, and the element after. When <code>fix.safe</code> is true the change needs no human decision and the CLI can apply it for you.</li>
</ul>
<pre data-lang="js" data-title="audit.mjs"><code>import { audit, formatText } from &quot;a11ymedic&quot;;

const result = await audit('&lt;img src=&quot;team-photo.jpg&quot;&gt;&lt;p style=&quot;color:#999&quot;&gt;Hi&lt;/p&gt;');

for (const f of result.findings) {
  console.log(f.rule, f.severity, f.message.en);
  console.log(&quot;  WCAG&quot;, f.wcag.map((c) =&gt; c.id).join(&quot;, &quot;), &quot;line&quot;, f.line);
  console.log(&quot;  before:&quot;, f.fix.before);
  console.log(&quot;  after: &quot;, f.fix.after);
}

console.log(formatText(result));</code></pre>
<p>For the contrast finding above, the fix says to change the text to <code>#767676</code> (4.54:1), the closest color with the same hue that passes. The <a href="how-to-fix-color-contrast.html">color contrast guide</a> explains how that suggestion is chosen.</p>

<h2 id="static-vs-browser">Static check or real browser?</h2>
<p>When a11ymedic reads an HTML file from disk, there is no layout engine. It cascades the page CSS itself to find colors, display and visibility, which is enough for most rules. What it cannot know is the rendered size of an element or the pixels behind a piece of text. So in a static check, a small icon link without explicit sizes is reported as "needs a human check", and text on a photo is never guessed.</p>
<p>In a real browser, the overlay and the headless mode use <code>getComputedStyle</code> and real element boxes. That is the most accurate option for target size (24 by 24 CSS pixels, or enough spacing) and for contrast on complex pages. A good rule of thumb: use static checks for fast feedback on every commit, and run the browser mode on the key pages of your deployed site.</p>

<h2 id="manual-checks">The 15 minute manual pass</h2>
<p>After the automated check is clean, spend a few minutes on what no tool can judge:</p>
<ul>
<li><strong>Keyboard only.</strong> Unplug the mouse. Tab through the page, open every menu and dialog, submit every form. Focus should always be visible and never get stuck.</li>
<li><strong>Zoom to 200 and 400 percent.</strong> Nothing should be cut off, and at 400 percent the page should not scroll sideways.</li>
<li><strong>Screen reader smoke test.</strong> Open the list of headings and the list of links. They should read like a table of contents and a set of clear destinations.</li>
<li><strong>Read the alt texts and labels.</strong> Are they true and useful in context?</li>
</ul>
<p>The <a href="wcag-cheat-sheet.html">WCAG cheat sheet</a> has a short manual tip for every criterion, including the ones no tool covers.</p>

<h2 id="first-audit-plan">A practical plan for your first audit</h2>
<p>Large sites often get hundreds of findings on the first run. Do not let the number stop you. Most of them come from a few shared components, so fixing one header or one card template can remove dozens at once.</p>
<ol>
<li>Run the CLI over your templates and sort by severity. Fix every critical finding first.</li>
<li>Apply the safe fixes automatically with <code>npx a11ymedic fix "src/**/*.html" --write</code>, then review the diff.</li>
<li>Fix contrast at the design token level rather than element by element.</li>
<li>Add a check to your pipeline so new problems cannot come back. The <a href="accessibility-testing-in-ci.html">CI guide</a> shows how.</li>
<li>Do the manual pass on your five most visited pages.</li>
</ol>
<p>Install instructions for every environment are in the <a href="./#install">install section</a>, and the full list of checks is in the <a href="./#rules">rules reference</a>.</p>
`,
    faq: [
      {
        q: "Can an automated website accessibility checker make my site compliant?",
        a: "No tool can prove full WCAG conformance on its own. Automated checks find the problems that can be decided from code, which are also the most common ones. You still need a short manual pass with the keyboard, zoom and a screen reader.",
      },
      {
        q: "Is a11ymedic free?",
        a: "Yes. It is open source under the MIT license. You can use the CLI, the Node API, the test matchers and the browser overlay at no cost, in personal and commercial projects.",
      },
      {
        q: "Can I check a website that is already online?",
        a: "Yes. Run npx a11ymedic followed by the URL. If Playwright or Puppeteer is installed it renders the page in a headless browser; otherwise it downloads the HTML and runs a static check.",
      },
      {
        q: "Which WCAG version does the checker use?",
        a: "The rules map to WCAG 2.2 success criteria. Level AA is checked by default, and you can add the AAA rules with the level option.",
      },
    ],
    related: ["wcag-2-2-checklist", "accessibility-testing-in-ci", "how-to-fix-color-contrast"],
  },

  {
    slug: "how-to-fix-color-contrast",
    title: "How to Fix Color Contrast Without Losing Your Brand",
    h1: "How to fix color contrast without losing your brand",
    description:
      "Learn the WCAG contrast ratios (4.5:1, 3:1 and 7:1), find failing text automatically, and fix it with the closest passing color that keeps your brand hue.",
    keywords:
      "how to fix color contrast, color contrast, contrast ratio, wcag contrast, 4.5:1, accessible colors, oklch, color contrast checker",
    lead:
      "Low contrast is the most common accessibility failure on the web, and also one of the easiest to fix once you know the numbers. This guide explains the WCAG ratios, the traps that hide failing text, and how to pick a passing color that still looks like your brand instead of falling back to plain black.",
    body: `
<h2 id="the-numbers">The numbers you need to know</h2>
<p>WCAG measures contrast as a ratio between the relative luminance of two colors. It goes from 1:1 (the same color) to 21:1 (black on white). The thresholds are simple:</p>
<table class="table">
<thead><tr><th>What</th><th>Level AA</th><th>Level AAA</th></tr></thead>
<tbody>
<tr><td>Normal text</td><td>4.5:1</td><td>7:1</td></tr>
<tr><td>Large text (24px, or 18.66px bold)</td><td>3:1</td><td>4.5:1</td></tr>
<tr><td>Icons, field borders, focus indicators, chart lines</td><td>3:1</td><td>3:1</td></tr>
</tbody>
</table>
<p>Text contrast is criterion <a href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html">1.4.3 Contrast (Minimum)</a>. The 3:1 rule for controls and graphics is <a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html">1.4.11 Non-text Contrast</a>. Large text is defined in CSS pixels: 24px regular, or 18.66px (14pt) when the weight is 700 or more. A 20px semibold heading is <strong>not</strong> large text and needs the full 4.5:1.</p>
<p>Some quick reference points on a white background: <code>#999999</code> is 2.84:1 and fails, <code>#767676</code> is 4.54:1 and is the lightest pure gray that passes, and <code>#595959</code> is 7:1 for AAA.</p>

<h2 id="who-is-affected">Who low contrast hurts</h2>
<p>Contrast is not only about people who are blind or have very low vision. It affects people with cataracts, glaucoma or color vision deficiency, older adults (contrast sensitivity drops with age), people using cheap or dim screens, and anyone reading a phone outdoors in sunlight. Light gray body text that looks elegant on a calibrated monitor in a dark office becomes unreadable on a bus at noon.</p>
<p>That is also why "it looks fine to me" is not a test. Designers usually have good eyesight and good screens. The ratio is the only objective check.</p>

<h2 id="find-failing-text">Find every failing piece of text</h2>
<p>Checking colors one pair at a time in a picker misses the cases that matter: inherited colors, semi transparent overlays, text on a gradient, text inside a card with its own background. a11ymedic walks up the tree from each text node, blends every background and <code>opacity</code> layer it passes, and measures the result. For gradients it measures every color stop and reports the worst one.</p>
<pre data-lang="sh" data-title="Run only the contrast checks"><code># AA contrast only
npx a11ymedic &quot;src/**/*.html&quot; --rules color-contrast

# AA and AAA
npx a11ymedic &quot;src/**/*.html&quot; --rules color-contrast,color-contrast-enhanced --level AAA</code></pre>
<p>Each finding states the measured ratio, the two colors, whether the text counts as large, and the required ratio. For example: "Contrast is 2.84:1 (#999999 on #ffffff). Normal text needs 4.5:1."</p>
<p>Text placed over a background image cannot be measured from code, because the pixels behind each letter are unknown. Those cases are listed as "needs a human check" instead of being guessed. Text inside disabled controls is skipped, because WCAG exempts it.</p>

<h2 id="pick-a-passing-color">Pick a passing color that keeps your brand</h2>
<p>The lazy fix is to make all text black. It works, but it throws away your design. The better fix is the <strong>closest</strong> color that passes. a11ymedic converts the color to OKLCH, a color space designed so that equal steps look equally different to the human eye. It keeps the hue and chroma, and moves only the lightness until the ratio is reached. The result looks like a slightly darker (or lighter) version of the same color, not a different color.</p>
<pre data-lang="js" data-title="suggest.mjs"><code>import { suggestColors, contrastRatio } from &quot;a11ymedic&quot;;

contrastRatio(&quot;#4a90e2&quot;, &quot;#ffffff&quot;); // 3.29, fails for normal text

const s = suggestColors(&quot;#4a90e2&quot;, &quot;#ffffff&quot;);
s.foreground;              // &quot;#3278c9&quot;, same blue, darker
s.ratio;                   // 4.5
s.changed;                 // &quot;foreground&quot;
s.backgroundOption;        // or keep the text and darken the background

// Ask for AAA instead
suggestColors(&quot;#4a90e2&quot;, &quot;#ffffff&quot;, { ratio: 7 });</code></pre>
<p>It also tries the opposite move, changing the background and keeping the text, and picks whichever is the smaller visual change. When no single color can reach the target (for example 7:1 on a mid tone background), it changes both. You can try this interactively in the <a href="./#contrast">contrast tool</a> on the home page.</p>

<h2 id="fix-at-the-source">Fix it once, in your design tokens</h2>
<p>If the same gray fails in forty places, do not patch forty elements. Change the variable they all use. That also prevents the problem from coming back in the next component.</p>
<pre data-lang="css" data-title="tokens.css"><code>/* Before: 2.84:1 on white, fails AA */
:root {
  --text-muted: #999999;
  --link: #4a90e2;
}

/* After: same hues, lightness adjusted to pass 4.5:1 */
:root {
  --text-muted: #767676;
  --link: #3278c9;
}</code></pre>
<p>Remember dark mode. A color that passes on white can fail on your dark surface, so check both themes. Hover and focus states count too: a link that darkens on hover is fine, a button that turns pale on hover is not.</p>

<h2 id="common-traps">Common traps</h2>
<ul>
<li><strong>Placeholder text.</strong> Browsers often render placeholders at a low opacity. If the placeholder carries instructions, it must pass 4.5:1. Better still, move instructions out of the placeholder (see the <a href="accessible-form-labels.html">form labels guide</a>).</li>
<li><strong>Opacity on a parent.</strong> <code>opacity: 0.6</code> on a card fades every child, including text that was fine on its own.</li>
<li><strong>White text on brand colors.</strong> White on a mid orange or a light green almost always fails. Darken the button background a little with the suggestion tool instead of changing the text.</li>
<li><strong>Thin fonts.</strong> A passing ratio with a 300 weight font at 14px is still hard to read. The ratio is a minimum, not a goal.</li>
<li><strong>Logos and decorative text.</strong> Logos are exempt, and so is text that is pure decoration. Text in a disabled control is exempt too.</li>
</ul>
<p>The full set of rules is in the <a href="./#rules">rules reference</a>, and the <a href="wcag-cheat-sheet.html">WCAG cheat sheet</a> lists every related criterion.</p>
`,
    faq: [
      {
        q: "What is the minimum color contrast ratio for WCAG AA?",
        a: "4.5:1 for normal text and 3:1 for large text, which is 24px regular or 18.66px bold. User interface parts such as input borders and icons need 3:1.",
      },
      {
        q: "How do I fix color contrast without changing my brand colors?",
        a: "Keep the hue and adjust only the lightness until the ratio passes. a11ymedic does this in the OKLCH color space and suggests the closest passing shade for the text or for the background.",
      },
      {
        q: "Does text over an image need to meet contrast requirements?",
        a: "Yes. Measure the worst spot behind the text. Because the pixels are not in the code, tools report it as a manual check. A solid or semi opaque backing behind the text is the most reliable fix.",
      },
      {
        q: "Is #767676 accessible on white?",
        a: "Yes. #767676 on #ffffff is about 4.54:1, which passes AA for normal text. It is the lightest neutral gray that does.",
      },
    ],
    related: ["website-accessibility-checker", "wcag-2-2-checklist", "accessible-form-labels"],
  },

  {
    slug: "alt-text-best-practices",
    title: "Alt Text Best Practices: Examples for Every Kind of Image",
    h1: "Alt text best practices, with examples for every kind of image",
    description:
      "Write alt text that helps: when to describe and when to leave alt empty, images in links and buttons, icons, charts and SVG, with before and after examples.",
    keywords:
      "alt text best practices, alt text, image alt, decorative images, alt attribute, accessible images, svg accessibility, alt text examples",
    lead:
      "Alt text is what a screen reader says instead of showing an image. Good alt text is short, specific and written for the context the image sits in. This guide shows how to decide between a description and an empty alt, how to handle images inside links and buttons, and what to do with icons, SVG and charts.",
    body: `
<h2 id="informative-or-decorative">First decide: informative or decorative?</h2>
<p>Every <code>&lt;img&gt;</code> needs an <code>alt</code> attribute. The only question is what goes in it. Ask one thing: <strong>if the image failed to load, would the reader miss any information?</strong></p>
<ul>
<li>If yes, the image is <strong>informative</strong>. Write what it shows or what it does, in a few words.</li>
<li>If no, it is <strong>decorative</strong>. Use an empty <code>alt=""</code>. Screen readers skip it completely.</li>
</ul>
<p>Leaving the attribute out is the worst option. Without <code>alt</code>, many screen readers read the file name instead, so a user hears "IMG underscore 2041 dot jpg". That is why a missing alt is a <strong>critical</strong> finding under <a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html">WCAG 1.1.1 Non-text Content</a>.</p>
<pre data-lang="html" data-title="Informative and decorative"><code>&lt;!-- Before --&gt;
&lt;img src=&quot;IMG_2041.jpg&quot;&gt;
&lt;img src=&quot;divider-swirl.png&quot;&gt;

&lt;!-- After --&gt;
&lt;img src=&quot;IMG_2041.jpg&quot; alt=&quot;Two nurses checking a patient's blood pressure&quot;&gt;
&lt;img src=&quot;divider-swirl.png&quot; alt=&quot;&quot;&gt;</code></pre>
<p>Typical decorative images are background flourishes, spacers, divider lines, and photos that only repeat text already next to them. a11ymedic uses clues like a file name containing "divider" or "spacer", a 1 by 1 tracking pixel, or a link that already has text, and offers <code>alt=""</code> as a safe automatic fix in those cases.</p>

<h2 id="writing-good-alt">How to write good alt text</h2>
<p>Think of alt text as what you would say if you were reading the page to a friend over the phone.</p>
<ul>
<li><strong>Be specific about what matters.</strong> "Red running shoe, side view, with a white sole" is more useful on a product page than "Shoe".</li>
<li><strong>Write for the context.</strong> The same photo of a CEO might be "Ana Souza, CEO" on a team page and "Ana Souza speaking at the 2026 product launch" in a news article.</li>
<li><strong>Keep it short.</strong> One sentence is usually enough. Screen readers cannot pause or navigate inside alt text, so long descriptions are tiring. a11ymedic flags alt text over 150 characters.</li>
<li><strong>Do not start with "image of" or "picture of".</strong> Screen readers already announce that it is an image. Removing the prefix is a safe automatic fix.</li>
<li><strong>Never use a file name or a placeholder.</strong> "hero.jpg", "image", "photo" and "untitled" are flagged because they say nothing.</li>
<li><strong>Include text that appears in the image.</strong> If a graphic says "50% off until Friday", the alt must say it too.</li>
</ul>

<h2 id="links-and-buttons">Images inside links and buttons</h2>
<p>When an image is the only content of a link or button, its alt text becomes the name of that control. So it must describe the <strong>destination or action</strong>, not the picture. A magnifier icon in a search button should be "Search", not "Magnifying glass". A logo that links home should be "Acme home", not "Acme logo".</p>
<pre data-lang="html" data-title="Linked images"><code>&lt;!-- Before: the link has no name --&gt;
&lt;a href=&quot;/&quot;&gt;&lt;img src=&quot;logo.svg&quot;&gt;&lt;/a&gt;

&lt;!-- After --&gt;
&lt;a href=&quot;/&quot;&gt;&lt;img src=&quot;logo.svg&quot; alt=&quot;Acme home&quot;&gt;&lt;/a&gt;

&lt;!-- Image and text in the same link: the text already names it --&gt;
&lt;a href=&quot;/cart&quot;&gt;&lt;img src=&quot;cart.svg&quot; alt=&quot;&quot;&gt; Cart&lt;/a&gt;</code></pre>
<p>In the last example the visible word "Cart" names the link, so the icon gets <code>alt=""</code>. If you gave it <code>alt="Cart"</code> as well, screen readers would say "Cart Cart". a11ymedic reports that repetition and fixes it automatically.</p>

<h2 id="svg-and-icons">SVG icons and icon fonts</h2>
<p>Inline SVG has no <code>alt</code> attribute. If the SVG is the only content of a button, give the button an <code>aria-label</code> and hide the SVG from assistive technology. If the SVG is a standalone meaningful graphic, give it <code>role="img"</code> and a name.</p>
<pre data-lang="html" data-title="Icon button and meaningful SVG"><code>&lt;!-- Icon only button --&gt;
&lt;button type=&quot;button&quot; aria-label=&quot;Close&quot;&gt;
  &lt;svg aria-hidden=&quot;true&quot; focusable=&quot;false&quot; viewBox=&quot;0 0 24 24&quot;&gt;...&lt;/svg&gt;
&lt;/button&gt;

&lt;!-- Standalone graphic --&gt;
&lt;svg role=&quot;img&quot; aria-label=&quot;Rating: 4 out of 5 stars&quot; viewBox=&quot;0 0 120 24&quot;&gt;...&lt;/svg&gt;</code></pre>
<p>The rules involved are <code>button-name</code> for the empty button and <code>role-img-alt</code> for an element with <code>role="img"</code> but no name. Image buttons (<code>&lt;input type="image"&gt;</code>) and image map areas follow the same idea and are checked by <code>input-image-alt</code> and <code>area-alt</code>.</p>

<h2 id="complex-images">Charts, diagrams and other complex images</h2>
<p>A bar chart with twelve values cannot fit in one sentence. Use a short alt that says what the chart is and its main point, then put the full data in visible text, a table or a <code>&lt;figcaption&gt;</code>. Everyone benefits from a data table, not only screen reader users.</p>
<pre data-lang="html" data-title="Chart with a long description"><code>&lt;figure&gt;
  &lt;img src=&quot;signups.png&quot;
       alt=&quot;Bar chart: monthly signups doubled between January and June&quot;
       aria-describedby=&quot;signups-data&quot;&gt;
  &lt;figcaption id=&quot;signups-data&quot;&gt;
    Signups per month: January 1,200; February 1,450; March 1,700;
    April 1,900; May 2,150; June 2,430.
  &lt;/figcaption&gt;
&lt;/figure&gt;</code></pre>

<h2 id="checking-alt-text">Check and fix alt text automatically</h2>
<p>A tool cannot tell whether a description is accurate, but it can find every image with no alt, every alt that is a file name or a placeholder, every redundant prefix, every alt that repeats the link text, and every alt that is too long. It also suggests a starting point for each missing alt, taken from a caption, a title attribute, the file name or the link destination.</p>
<pre data-lang="sh" data-title="Preview and apply the safe fixes"><code># See which images fail
npx a11ymedic &quot;src/**/*.html&quot; --rules image-alt,image-alt-quality,role-img-alt

# Preview the safe fixes (empty alt on decorative images, prefix removal) as a diff
npx a11ymedic fix &quot;src/**/*.html&quot;

# Apply them
npx a11ymedic fix &quot;src/**/*.html&quot; --write</code></pre>
<p>Only fixes that need no human decision are applied. A real description is never written for you, because only a person who knows the content can write it. After the automated pass, read your alt texts out loud without looking at the images. If you get the same information, they are good.</p>
<p>See the <a href="./#rules">rules reference</a> for all the image checks, or paste a snippet into the <a href="./#checkup">online check-up</a>.</p>
`,
    faq: [
      {
        q: "Should decorative images have alt text?",
        a: "They should have an alt attribute that is empty, written as alt with two quotes and nothing between them. That tells screen readers to skip the image. Leaving the attribute out makes many screen readers read the file name.",
      },
      {
        q: "How long should alt text be?",
        a: "Usually one short sentence, often under 100 characters. If an image needs more, keep the alt short and put the full description in visible text or a caption linked with aria-describedby.",
      },
      {
        q: "Should alt text start with image of?",
        a: "No. Screen readers already announce that the element is an image, so the prefix only adds noise. Start with what the image shows.",
      },
      {
        q: "What alt text should a logo have?",
        a: "The company name. If the logo links to the home page, describe the destination, for example the company name followed by home.",
      },
    ],
    related: ["aria-label-vs-aria-labelledby", "website-accessibility-checker", "wcag-2-2-checklist"],
  },

  {
    slug: "accessible-form-labels",
    title: "Accessible Forms Labels: How to Label Every Field Right",
    h1: "Accessible form labels: how to label every field right",
    description:
      "Label every form field the accessible way: visible labels, fieldset and legend, hints and errors with aria-describedby, autocomplete and paste friendly logins.",
    keywords:
      "accessible forms labels, accessible form labels, form labels, label element, placeholder accessibility, fieldset legend, aria-describedby, autocomplete",
    lead:
      "A form field without a label is a guessing game. Screen readers announce it as an unnamed edit box, voice control users cannot say its name, and everyone loses the hint once a placeholder disappears. This guide covers the label element, groups of options, hints and errors, autocomplete, and the mistakes that automated checks catch most often.",
    body: `
<h2 id="use-a-real-label">Use a real, visible label</h2>
<p>The best label is a <code>&lt;label&gt;</code> element connected to its field. Connect them with <code>for</code> and <code>id</code>, or wrap the field inside the label. A connected label does three things at once: screen readers read it when the field gets focus, voice control users can say it to move to the field, and clicking the label focuses the field, which gives people with limited dexterity a larger target.</p>
<pre data-lang="html" data-title="Label a field"><code>&lt;!-- Before: a placeholder is not a label --&gt;
&lt;input type=&quot;email&quot; placeholder=&quot;Email&quot;&gt;

&lt;!-- After: explicit association --&gt;
&lt;label for=&quot;email&quot;&gt;Email&lt;/label&gt;
&lt;input type=&quot;email&quot; id=&quot;email&quot; autocomplete=&quot;email&quot;&gt;

&lt;!-- Also valid: wrapping --&gt;
&lt;label&gt;
  Email
  &lt;input type=&quot;email&quot; autocomplete=&quot;email&quot;&gt;
&lt;/label&gt;</code></pre>
<p>A missing label fails three WCAG criteria together: 1.3.1 Info and Relationships, <a href="https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html">3.3.2 Labels or Instructions</a> and 4.1.2 Name, Role, Value. a11ymedic reports it under the <code>label</code> rule and proposes the exact label element to add, with an <code>id</code> on the field if it does not have one.</p>

<h2 id="placeholder-is-not-a-label">Why a placeholder is not a label</h2>
<p>Placeholder only forms look clean in a mockup and cause real problems in use:</p>
<ul>
<li>The text disappears as soon as someone types, so people with short term memory difficulties forget what the field was for.</li>
<li>When the browser autofills a form, every placeholder vanishes at once and nobody can check which value went where.</li>
<li>Placeholder text is usually light gray and fails the 4.5:1 contrast minimum.</li>
<li>Some screen reader and browser combinations do not announce placeholders reliably.</li>
</ul>
<p>Keep the placeholder for an example value if you like ("name@example.com"), but always add a label. The same goes for a <code>title</code> attribute used as the only name: it shows only on mouse hover and never on touch screens.</p>

<h2 id="groups">Group related options with fieldset and legend</h2>
<p>A set of radio buttons answers one question, and that question needs a label too. Without it, a screen reader user lands on a radio button that says "Yes" with no idea what they are agreeing to. Wrap the options in a <code>&lt;fieldset&gt;</code> and put the question in a <code>&lt;legend&gt;</code>. The <code>radio-group</code> rule flags radios that share a name but have no group label.</p>
<pre data-lang="html" data-title="Radio group"><code>&lt;fieldset&gt;
  &lt;legend&gt;Delivery speed&lt;/legend&gt;
  &lt;label&gt;&lt;input type=&quot;radio&quot; name=&quot;speed&quot; value=&quot;standard&quot;&gt; Standard (5 days)&lt;/label&gt;
  &lt;label&gt;&lt;input type=&quot;radio&quot; name=&quot;speed&quot; value=&quot;express&quot;&gt; Express (1 day)&lt;/label&gt;
&lt;/fieldset&gt;</code></pre>
<p>Use the same pattern for groups of checkboxes and for compound fields such as a date split into day, month and year.</p>

<h2 id="hints-and-errors">Hints, required fields and error messages</h2>
<p>Instructions that apply to a field, such as a required format, belong in visible text connected with <code>aria-describedby</code>. Screen readers read the description after the label. Do the same with error messages, and mark the field with <code>aria-invalid="true"</code> while it is wrong.</p>
<pre data-lang="html" data-title="Hint and error"><code>&lt;label for=&quot;dob&quot;&gt;Date of birth&lt;/label&gt;
&lt;p id=&quot;dob-hint&quot;&gt;For example 05/09/1990&lt;/p&gt;
&lt;input id=&quot;dob&quot; name=&quot;dob&quot; inputmode=&quot;numeric&quot; autocomplete=&quot;bday&quot;
       aria-describedby=&quot;dob-hint dob-error&quot; aria-invalid=&quot;true&quot; required&gt;
&lt;p id=&quot;dob-error&quot;&gt;Enter the date as DD/MM/YYYY.&lt;/p&gt;</code></pre>
<p>Good error messages name the field, say what is wrong and say how to fix it ("Enter the date as DD/MM/YYYY", not "Invalid input"). Do not rely on a red border alone: color by itself fails 1.4.1 Use of Color. Mark required fields in the label text or with a visible marker that is explained at the top of the form, and add the <code>required</code> attribute so assistive technology announces it.</p>

<h2 id="autocomplete">Autocomplete and pasting</h2>
<p>Fields that ask for the user's own data should use the correct <code>autocomplete</code> token: <code>name</code>, <code>given-name</code>, <code>email</code>, <code>tel</code>, <code>street-address</code>, <code>postal-code</code>, <code>bday</code>, <code>current-password</code>, <code>new-password</code>, <code>one-time-code</code> and so on. This is <a href="https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html">1.3.5 Identify Input Purpose</a>. It saves typing for people with motor disabilities and reduces errors for people with memory or cognitive disabilities. a11ymedic checks for invalid tokens (<code>autocomplete-valid</code>) and for personal fields that have none (<code>input-purpose</code>).</p>
<p>Never block paste. A password field with <code>onpaste="return false"</code> breaks password managers and forces people to transcribe long strings from memory, which fails the new WCAG 2.2 criterion 3.3.8 Accessible Authentication. The <code>paste-blocked</code> rule catches it.</p>

<h2 id="when-no-visible-label">When there is no room for a visible label</h2>
<p>Some fields have a clear visual context, such as a search box next to a "Search" button. In that case an <code>aria-label</code> or <code>aria-labelledby</code> pointing at the button text is acceptable. Treat this as the exception. A visible label helps everyone, including people who do not use assistive technology. If you do use <code>aria-label</code> on a control that has visible text, the name must contain that text, ideally at the start. Otherwise voice control users who say what they see get no response. That is 2.5.3 Label in Name, checked by <code>label-in-name</code>. The <a href="aria-label-vs-aria-labelledby.html">aria-label vs aria-labelledby guide</a> explains the difference between the two attributes.</p>

<h2 id="test-your-forms">Test your forms automatically</h2>
<p>Form markup lives in components, so test it where it is built. The test matchers let a unit test fail as soon as someone ships a field without a label.</p>
<pre data-lang="ts" data-title="signup-form.test.ts"><code>import { test, expect } from &quot;vitest&quot;;
import { audit } from &quot;a11ymedic&quot;;
import &quot;a11ymedic/vitest&quot;;
import { renderSignupForm } from &quot;./signup-form&quot;;

test(&quot;signup form is accessible&quot;, async () =&gt; {
  const html = renderSignupForm();
  expect(await audit(html)).toHaveNoViolations();
});</code></pre>
<p>Then do one manual check: fill the form using only the keyboard, trigger every error, and listen to it once with a screen reader. The <a href="accessibility-testing-in-ci.html">CI guide</a> shows how to run these tests on every pull request.</p>
`,
    faq: [
      {
        q: "Is a placeholder enough as a form label?",
        a: "No. A placeholder disappears when the user types, is usually too low in contrast, and is not announced reliably. Use a visible label element and keep the placeholder only for an example value.",
      },
      {
        q: "Should I use aria-label or a label element for inputs?",
        a: "Use a visible label element whenever you can. It helps everyone and makes the label clickable. Use aria-label only when the purpose is already clear from the visual context, such as a search box next to a Search button.",
      },
      {
        q: "How do I make radio buttons accessible?",
        a: "Give each radio its own label, then wrap the whole set in a fieldset with a legend that asks the question. Screen readers then announce the question together with each option.",
      },
      {
        q: "How should form errors be announced to screen readers?",
        a: "Show the error as text next to the field, connect it with aria-describedby, set aria-invalid to true, and move focus to the first invalid field or to an error summary when the form is submitted.",
      },
    ],
    related: ["aria-label-vs-aria-labelledby", "how-to-fix-color-contrast", "accessibility-testing-in-ci"],
  },
  {
    slug: "wcag-2-2-checklist",
    title: "WCAG 2.2 Checklist for Developers, A and AA in Plain Words",
    h1: "WCAG 2.2 checklist for developers",
    description:
      "A practical WCAG 2.2 checklist for levels A and AA: what changed from 2.1, the six new criteria, and which items a tool can check and which need a human.",
    keywords:
      "wcag 2.2 checklist, wcag 2.2, wcag checklist, wcag aa checklist, accessibility checklist, new in wcag 2.2, target size, focus not obscured",
    lead:
      "WCAG 2.2 has 55 success criteria at levels A and AA. You do not need to memorize them. This checklist groups them by the part of the page you are building, marks what changed in 2.2, and separates the items a tool can verify from the ones that need a person with a keyboard and a screen reader.",
    body: `
<h2 id="what-changed">What changed in WCAG 2.2</h2>
<p>WCAG 2.2 became a W3C Recommendation in October 2023. It keeps everything from 2.1, removes one criterion, and adds nine new ones. Six of the new criteria are at levels A and AA, which is the level most accessibility policies and contracts ask for:</p>
<table class="table">
<thead><tr><th>Criterion</th><th>Level</th><th>In one line</th></tr></thead>
<tbody>
<tr><td>2.4.11 Focus Not Obscured (Minimum)</td><td>AA</td><td>Sticky headers and banners must not completely cover the focused element.</td></tr>
<tr><td>2.5.7 Dragging Movements</td><td>AA</td><td>Anything you can drag must also work with single clicks.</td></tr>
<tr><td>2.5.8 Target Size (Minimum)</td><td>AA</td><td>Targets are at least 24 by 24 CSS pixels, or well spaced.</td></tr>
<tr><td>3.2.6 Consistent Help</td><td>A</td><td>Help links and contact options stay in the same place on every page.</td></tr>
<tr><td>3.3.7 Redundant Entry</td><td>A</td><td>Do not make people type the same information twice in one process.</td></tr>
<tr><td>3.3.8 Accessible Authentication (Minimum)</td><td>AA</td><td>No memory or puzzle tests to log in; allow paste and password managers.</td></tr>
</tbody>
</table>
<p>The other three new criteria (2.4.12, 2.4.13 and 3.3.9) are at level AAA. Criterion 4.1.1 Parsing was removed, because modern browsers and assistive technologies all parse HTML the same way. Duplicate ids still matter when they break a label or an ARIA reference, and those cases are covered by 1.3.1 and 4.1.2.</p>

<h2 id="levels">A, AA and AAA in practice</h2>
<p><strong>Level A</strong> is the floor: without it, some people cannot use the page at all. <strong>Level AA</strong> adds the criteria that make a page comfortable for most people, such as 4.5:1 text contrast and visible focus. It is the usual target. <strong>Level AAA</strong> is not required for whole sites, but some of its criteria are cheap wins, such as 7:1 contrast for body text or respecting reduced motion. a11ymedic checks level AA by default; add <code>--level AAA</code> to include the enhanced 7:1 contrast check.</p>

<h2 id="checklist">The checklist, by area</h2>
<p>Each item names the criterion. Items marked <strong>tool</strong> are checked automatically by a11ymedic; the rest need a manual check. The <a href="wcag-cheat-sheet.html">WCAG cheat sheet</a> has a plain language summary and a manual tip for every criterion.</p>
<p><strong>Images and media</strong></p>
<ul>
<li>Every informative image has a useful text alternative, decorative ones have <code>alt=""</code> (1.1.1, tool, plus a human read).</li>
<li>Recorded video has captions (1.2.2, tool finds missing caption tracks), audio has a transcript (1.2.1), and visual information is described (1.2.3, 1.2.5).</li>
<li>Live video has live captions (1.2.4).</li>
<li>No sound plays on its own for more than 3 seconds without a pause control (1.4.2, tool).</li>
</ul>
<p><strong>Structure and reading order</strong></p>
<ul>
<li>Headings, lists, tables, landmarks and labels exist in the code, not only in the styling (1.3.1, tool).</li>
<li>The reading order in the code matches the visual order (1.3.2).</li>
<li>Every page has a unique, descriptive title (2.4.2, tool) and a way to skip repeated navigation (2.4.1, tool).</li>
<li>Headings and labels describe their content (2.4.6, tool for empty headings and a missing h1).</li>
<li>There is more than one way to find a page, such as navigation plus search (2.4.5).</li>
</ul>
<p><strong>Color and visual presentation</strong></p>
<ul>
<li>Text contrast is at least 4.5:1, or 3:1 for large text (1.4.3, tool). The <a href="how-to-fix-color-contrast.html">contrast guide</a> shows how to fix it without losing your brand.</li>
<li>Controls and meaningful graphics have 3:1 contrast against their surroundings (1.4.11).</li>
<li>Color is never the only way information is shown (1.4.1).</li>
<li>Text can be zoomed to 200 percent, and pinch zoom is not disabled (1.4.4, tool for the viewport tag).</li>
<li>Content reflows at 320 CSS pixels wide without sideways scrolling (1.4.10), survives larger text spacing (1.4.12), and hover content can be dismissed (1.4.13).</li>
<li>No real text is baked into images (1.4.5) and the page works in both orientations (1.3.4).</li>
</ul>
<p><strong>Keyboard, focus and pointer</strong></p>
<ul>
<li>Everything works with the keyboard (2.1.1, tool for click handlers on non interactive elements) and focus never gets trapped (2.1.2).</li>
<li>Focus order makes sense (2.4.3, tool for positive tabindex) and focus is always visible (2.4.7, tool for removed outlines).</li>
<li>The focused element is never fully hidden by sticky content (2.4.11, new).</li>
<li>Single key shortcuts can be turned off or remapped (2.1.4).</li>
<li>Gestures and drags have single pointer alternatives (2.5.1, 2.5.7 new), actions fire on release (2.5.2), and motion triggers have a button (2.5.4).</li>
<li>Targets are at least 24 by 24 CSS pixels (2.5.8 new, tool) and the visible label is part of the accessible name (2.5.3, tool).</li>
</ul>
<p><strong>Forms and authentication</strong></p>
<ul>
<li>Every field has a label or instructions (3.3.2, tool) and personal fields have a valid <code>autocomplete</code> (1.3.5, tool).</li>
<li>Errors are identified in text (3.3.1), come with a suggestion (3.3.3), and important submissions can be reviewed or undone (3.3.4).</li>
<li>Information is not asked for twice (3.3.7 new) and login allows paste and password managers (3.3.8 new, tool for blocked paste).</li>
<li>Changing a field or moving focus never causes a surprise navigation (3.2.1, 3.2.2).</li>
</ul>
<p><strong>Language, consistency and robustness</strong></p>
<ul>
<li>The page has a valid <code>lang</code> (3.1.1, tool) and passages in other languages are marked (3.1.2, tool for invalid codes).</li>
<li>Navigation, component names and help stay consistent across pages (3.2.3, 3.2.4, 3.2.6 new).</li>
<li>Every control has a name, a role and correct states (4.1.2, tool for most ARIA mistakes), and status messages are announced (4.1.3).</li>
<li>Nothing flashes more than 3 times per second (2.3.1), moving content can be paused (2.2.2, tool for marquee, blink and autoplay), and time limits can be extended (2.2.1, tool for meta refresh).</li>
</ul>

<h2 id="automate">Automate the tool items</h2>
<p>Run the automated part on every change so you only spend human time on the manual items.</p>
<pre data-lang="sh" data-title="Check A and AA"><code>npx a11ymedic &quot;src/**/*.html&quot;                  # levels A and AA (default)
npx a11ymedic &quot;src/**/*.html&quot; --level AAA      # include the AAA rules
npx a11ymedic https://example.com --format md -o wcag-report.md</code></pre>
<pre data-lang="js" data-title="Group findings by criterion"><code>import { audit } from &quot;a11ymedic&quot;;

const result = await audit(html, { level: &quot;AA&quot; });
const byCriterion = new Map();
for (const f of result.findings) {
  for (const c of f.wcag) {
    byCriterion.set(c.id, (byCriterion.get(c.id) ?? 0) + 1);
  }
}
console.log(byCriterion); // Map { &quot;1.1.1&quot; =&gt; 3, &quot;1.4.3&quot; =&gt; 5, ... }</code></pre>

<h2 id="new-criteria-fixes">Meeting the new 2.2 criteria</h2>
<p><strong>Target size.</strong> The simplest way to pass 2.5.8 is a minimum size on every small control. Padding counts, so an icon can stay 16 pixels while its button is 24 or more. Links inside a sentence are exempt.</p>
<pre data-lang="css" data-title="Target size and focus not obscured"><code>/* 2.5.8: at least 24 by 24 CSS pixels */
.icon-button {
  min-width: 24px;
  min-height: 24px;
  padding: 4px;
}

/* 2.4.11: keep focused elements clear of a 64px sticky header */
html {
  scroll-padding-top: 72px;
}</code></pre>
<p><strong>Focus not obscured.</strong> When a sticky header or a cookie banner sits on top of the page, keyboard focus can land on an element hidden behind it. <code>scroll-padding</code> makes the browser scroll focused elements into the visible area. Also check that banners do not cover the bottom of the screen indefinitely.</p>
<p><strong>Dragging.</strong> Give every draggable item a button based alternative, such as "Move up" and "Move down", or a menu to choose a destination column.</p>
<pre data-lang="html" data-title="Dragging alternative"><code>&lt;li draggable=&quot;true&quot;&gt;
  Write release notes
  &lt;button type=&quot;button&quot;&gt;Move up&lt;/button&gt;
  &lt;button type=&quot;button&quot;&gt;Move down&lt;/button&gt;
&lt;/li&gt;</code></pre>
<p><strong>Accessible authentication.</strong> Allow paste in every login field, use <code>autocomplete="current-password"</code> and <code>autocomplete="one-time-code"</code>, and if you use a puzzle, offer an alternative such as an email link. <strong>Redundant entry</strong> and <strong>consistent help</strong> are design decisions: add a "same as shipping address" checkbox, and keep the help link in one place in your layout.</p>
<p>To start testing, see the <a href="website-accessibility-checker.html">website accessibility checker guide</a> or jump to the <a href="./#install">install section</a>.</p>
`,
    faq: [
      {
        q: "What is new in WCAG 2.2?",
        a: "Nine new success criteria, six of them at levels A and AA: Focus Not Obscured, Dragging Movements, Target Size, Consistent Help, Redundant Entry and Accessible Authentication. Criterion 4.1.1 Parsing was removed.",
      },
      {
        q: "How many success criteria are in WCAG 2.2 level AA?",
        a: "55 criteria in total across levels A and AA: 31 at level A and 24 at level AA. Level AAA adds more, but it is not usually required for a whole site.",
      },
      {
        q: "What is the minimum target size in WCAG 2.2?",
        a: "24 by 24 CSS pixels for level AA, criterion 2.5.8. Smaller targets pass if they have enough space that a 24 pixel circle centered on each one does not touch another target. Links inside text are exempt.",
      },
      {
        q: "Can a tool check the whole WCAG 2.2 checklist?",
        a: "No. Tools reliably check items like missing alt, contrast, labels and ARIA. Items such as caption quality, reading order, consistent help and redundant entry need a human review.",
      },
    ],
    related: ["website-accessibility-checker", "accessibility-testing-in-ci", "how-to-fix-color-contrast"],
  },

  {
    slug: "accessibility-testing-in-ci",
    title: "Accessibility Testing in CI with GitHub Actions and Vitest",
    h1: "Accessibility testing in CI",
    description:
      "Add accessibility testing to CI: fail builds on serious issues, get GitHub Actions annotations and a job summary, and test components with Vitest or Jest.",
    keywords:
      "accessibility testing in ci, accessibility testing, github actions accessibility, a11y ci, vitest accessibility, jest accessibility, toHaveNoViolations, automated accessibility testing",
    lead:
      "Accessibility bugs are cheapest to fix in the pull request that creates them. Running a checker in continuous integration turns accessibility from an occasional audit into a normal test: a new button without a name fails the build just like a broken import, and the report points to the exact line and the fix.",
    body: `
<h2 id="why-ci">Why run accessibility checks in CI</h2>
<p>A one time audit finds problems, but it does not stop new ones. Teams that fix two hundred issues in a sprint often find a hundred new ones six months later, because nothing changed in how code gets merged. A check in CI changes that. Each pull request is compared against the same rules, the author sees the problem while the code is still fresh, and reviewers no longer need to spot missing labels by eye.</p>
<p>Automated checks will not catch everything (reading order, caption quality and the usefulness of alt text still need people), but they reliably catch the mistakes that are both common and serious: missing names, missing labels, low contrast, broken ARIA, removed focus outlines and disabled zoom.</p>

<h2 id="cli-gate">The CLI as a quality gate</h2>
<p>The CLI exits with code 1 when it finds a problem at or above the severity you choose with <code>--fail-on</code>. The default is <code>minor</code>, which fails on anything. Use <code>none</code> to report without failing.</p>
<pre data-lang="sh" data-title="Fail the build"><code># Fail only on critical and serious findings
npx a11ymedic &quot;dist/**/*.html&quot; --fail-on serious

# Report everything, never fail (useful for a first run)
npx a11ymedic &quot;dist/**/*.html&quot; --fail-on none --format html -o a11y-report.html

# Machine readable output for dashboards
npx a11ymedic &quot;dist/**/*.html&quot; --format json -o a11y.json</code></pre>
<p>Point it at your built HTML (the output of a static site generator, or prerendered pages) for a fast static check. For pages that need JavaScript to render, see the section on live URLs below.</p>

<h2 id="github-actions">GitHub Actions</h2>
<p>On GitHub Actions you do not need any extra configuration. When the <code>GITHUB_ACTIONS</code> environment variable is set, a11ymedic prints annotations, so each finding shows up inline on the changed file in the pull request, and writes a job summary with the counts and the fixes. You can force it on or off with <code>--github</code> and <code>--no-github</code>, or produce the same output anywhere with <code>--format github</code>.</p>
<pre data-lang="yaml" data-title=".github/workflows/accessibility.yml"><code>name: Accessibility

on:
  pull_request:
  push:
    branches: [main]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - run: npx a11ymedic &quot;dist/**/*.html&quot; --fail-on serious</code></pre>
<p>If you also want a downloadable report, add <code>--format html -o a11y-report.html</code> to a second run and upload the file as a build artifact. The HTML report is self contained, so anyone on the team can open it without installing anything.</p>

<h2 id="unit-tests">Unit and component tests with Vitest or Jest</h2>
<p>CI checks on built pages catch problems late in the pipeline. Component tests catch them earlier, where the markup is written. a11ymedic ships a <code>toHaveNoViolations</code> matcher. Import the setup file once and use it like any other assertion. HTML without <code>&lt;html&gt;</code> or <code>&lt;body&gt;</code> is treated as a component fragment, so page level rules such as the document title and the main landmark are skipped automatically.</p>
<pre data-lang="ts" data-title="button.test.ts (Vitest)"><code>import { test, expect } from &quot;vitest&quot;;
import { audit } from &quot;a11ymedic&quot;;
import &quot;a11ymedic/vitest&quot;;

test(&quot;icon button has a name&quot;, async () =&gt; {
  const html = \`&lt;button type=&quot;button&quot; aria-label=&quot;Close&quot;&gt;&lt;svg aria-hidden=&quot;true&quot;&gt;&lt;/svg&gt;&lt;/button&gt;\`;
  expect(await audit(html)).toHaveNoViolations();
});

test(&quot;settings page has no serious problems&quot;, async () =&gt; {
  const html = renderSettingsPage();
  expect(await audit(html)).toHaveNoViolations({ severity: &quot;serious&quot; });
});</code></pre>
<p>For Jest, register the matcher in your config instead of importing it in each file:</p>
<pre data-lang="js" data-title="jest.config.js"><code>module.exports = {
  testEnvironment: &quot;node&quot;,
  setupFilesAfterEnv: [&quot;a11ymedic/jest&quot;],
};</code></pre>
<p>When a test fails, the message lists each finding with its rule, the element, and the before and after code, so the fix is in the test output. The matcher also accepts an <code>ignore</code> list of rule ids for cases you have reviewed and accepted.</p>

<h2 id="live-urls">Testing live URLs and rendered apps</h2>
<p>Single page apps render most of their markup in the browser, so the raw HTML file is almost empty. Pass a URL instead. If Playwright or Puppeteer is installed in the project, the CLI loads the page in a headless browser and audits the rendered result with real computed styles and element sizes. That is the most accurate mode for color contrast and for the 24 by 24 pixel target size rule. Without a browser it fetches the HTML and runs a static check. Use <code>--browser</code> to require the headless browser, or <code>--no-browser</code> to forbid it.</p>
<pre data-lang="sh" data-title="Audit a preview deployment"><code>npm install --save-dev playwright
npx playwright install chromium

npx a11ymedic https://preview.example.com/ https://preview.example.com/pricing --browser --fail-on serious</code></pre>

<h2 id="rollout">Rolling it out on an existing codebase</h2>
<p>If the first run reports 300 findings, a strict gate will block every pull request and the team will turn it off. Roll it out in steps instead:</p>
<ol>
<li><strong>Report only.</strong> Run with <code>--fail-on none</code> and publish the report. Fix the shared components first; one header fix can remove dozens of findings.</li>
<li><strong>Apply the safe fixes.</strong> <code>npx a11ymedic fix "src/**/*.html" --write</code> applies changes that need no human decision, such as <code>alt=""</code> on decorative images or a missing <code>lang</code> when the language can be detected. Review the diff and commit it.</li>
<li><strong>Gate on critical.</strong> Switch to <code>--fail-on critical</code>. New critical problems now fail the build.</li>
<li><strong>Tighten.</strong> Move to <code>--fail-on serious</code>, then lower as the backlog shrinks.</li>
</ol>
<p>Use <code>--exclude</code> with a CSS selector to skip third party widgets you cannot change, and <code>--disable</code> to turn off a rule while a known issue is being worked on. Keep those exceptions in one place, such as an <code>a11y</code> script in <code>package.json</code> that every developer and the CI job run the same way, so they stay visible and get reviewed like any other code.</p>
<p>Pair the gate with a short manual pass on every release: keyboard only, zoom to 200 percent, and a screen reader check on the main flows. The <a href="wcag-2-2-checklist.html">WCAG 2.2 checklist</a> marks which items need that human review, and the <a href="./#install">install section</a> covers every setup.</p>
`,
    faq: [
      {
        q: "How do I add accessibility testing to GitHub Actions?",
        a: "Build your site, then run npx a11ymedic on the generated HTML with --fail-on serious. On GitHub Actions it adds inline annotations to the pull request and writes a job summary automatically.",
      },
      {
        q: "Can I use toHaveNoViolations with Vitest?",
        a: "Yes. Import a11ymedic/vitest once, then call expect(await audit(html)).toHaveNoViolations(). You can pass a minimum severity or a list of rule ids to ignore.",
      },
      {
        q: "Should accessibility tests fail the build?",
        a: "Yes, once the existing backlog is under control. Start in report only mode, fix shared components, then fail on critical findings and tighten the threshold over time.",
      },
      {
        q: "Do I need a headless browser for accessibility testing in CI?",
        a: "Not for static HTML, which is checked quickly without one. For pages rendered by JavaScript, and for the most accurate contrast and target size results, install Playwright or Puppeteer and pass URLs.",
      },
    ],
    related: ["website-accessibility-checker", "wcag-2-2-checklist", "accessible-form-labels"],
  },

  {
    slug: "aria-label-vs-aria-labelledby",
    title: "aria-label vs aria-labelledby: Which One to Use and When",
    h1: "aria-label vs aria-labelledby: which one to use and when",
    description:
      "aria-label vs aria-labelledby explained with examples: how accessible names are computed, when each attribute fits, and the mistakes screen readers ignore.",
    keywords:
      "aria label vs aria labelledby, aria-label, aria-labelledby, aria-describedby, accessible name, aria label, screen reader label",
    lead:
      "Both attributes give an element its accessible name, the text a screen reader announces and a voice control user speaks. aria-labelledby points to visible text that is already on the page; aria-label holds a string that nobody sees. Choosing the right one, and knowing where neither works, avoids most of the ARIA naming bugs found in real audits.",
    body: `
<h2 id="quick-answer">The short answer</h2>
<ul>
<li>If a native HTML way exists, use it first: a <code>&lt;label&gt;</code> for form fields, <code>alt</code> for images, text inside the button or link, <code>&lt;legend&gt;</code> for a fieldset, <code>&lt;caption&gt;</code> for a table.</li>
<li>If visible text on the page already names the element, use <strong>aria-labelledby</strong> and point to it. The name then matches what sighted users see and stays in sync when the text changes or is translated.</li>
<li>If there is no visible text at all, as with an icon only button, use <strong>aria-label</strong>.</li>
<li>If the extra text is a hint or a description rather than a name, use <strong>aria-describedby</strong>.</li>
</ul>

<h2 id="name-computation">How the accessible name is computed</h2>
<p>Browsers follow the W3C accessible name algorithm. Simplified, they take the first source that gives a non empty result, in this order:</p>
<ol>
<li><code>aria-labelledby</code>: the text of the referenced elements, joined with spaces in the order of the ids.</li>
<li><code>aria-label</code>: the string value.</li>
<li>The native label: a connected <code>&lt;label&gt;</code>, <code>alt</code>, <code>&lt;caption&gt;</code>, <code>&lt;legend&gt;</code>, and similar.</li>
<li>The content of the element, for roles that are named from content, such as buttons, links and headings.</li>
<li>Last resort: <code>title</code> and, for inputs, <code>placeholder</code>.</li>
</ol>
<p>This order has an important consequence: <strong>aria-labelledby and aria-label override everything else</strong>, including the visible text inside a button. If a button shows "Buy now" and has <code>aria-label="Add product 4821 to basket"</code>, screen readers announce only the aria-label. When both attributes are present, aria-labelledby wins. MDN has a detailed reference for <a href="https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label">aria-label</a> and <a href="https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-labelledby">aria-labelledby</a>.</p>

<h2 id="aria-label">When aria-label is the right choice</h2>
<p>Use aria-label when the element has a clear visual meaning but no text: a close button with an X icon, a search button with a magnifier, a social link with only a logo, or a <code>&lt;nav&gt;</code> landmark that needs a name to tell it apart from a second navigation region.</p>
<pre data-lang="html" data-title="aria-label examples"><code>&lt;!-- Icon only button --&gt;
&lt;button type=&quot;button&quot; aria-label=&quot;Close&quot;&gt;
  &lt;svg aria-hidden=&quot;true&quot; focusable=&quot;false&quot; viewBox=&quot;0 0 24 24&quot;&gt;...&lt;/svg&gt;
&lt;/button&gt;

&lt;!-- Two navigation landmarks that need different names --&gt;
&lt;nav aria-label=&quot;Main&quot;&gt;...&lt;/nav&gt;
&lt;nav aria-label=&quot;Breadcrumb&quot;&gt;...&lt;/nav&gt;</code></pre>
<p>Keep in mind three drawbacks. The text is invisible, so designers and testers rarely notice when it goes out of date. Some automatic page translation tools do not translate attribute values, so a translated page may still announce English labels. And it is easy to write a name that does not match the visible label, which breaks voice control.</p>

<h2 id="aria-labelledby">When aria-labelledby is the right choice</h2>
<p>Use aria-labelledby when the name is already on screen. The classic cases are dialogs named by their heading, tab panels named by their tab, regions named by their section heading, and custom widgets named by a nearby text label. It takes one or more ids separated by spaces, and it can even reference an element that is hidden, which is useful for combining text.</p>
<pre data-lang="html" data-title="aria-labelledby examples"><code>&lt;!-- Dialog named by its heading --&gt;
&lt;div role=&quot;dialog&quot; aria-modal=&quot;true&quot; aria-labelledby=&quot;delete-title&quot;&gt;
  &lt;h2 id=&quot;delete-title&quot;&gt;Delete this file?&lt;/h2&gt;
  ...
&lt;/div&gt;

&lt;!-- Unique link names built from visible text: &quot;Read more Pricing update&quot; --&gt;
&lt;h3 id=&quot;post-12&quot;&gt;Pricing update&lt;/h3&gt;
&lt;a href=&quot;/blog/pricing&quot; id=&quot;more-12&quot; aria-labelledby=&quot;more-12 post-12&quot;&gt;Read more&lt;/a&gt;</code></pre>
<p>In the second example ten "Read more" links stop being ten identical links in a screen reader's links list. The rule <code>aria-dialog-name</code> catches dialogs with no name, and when the dialog already has a heading with an id, a11ymedic offers the aria-labelledby fix automatically.</p>

<h2 id="describedby">Name or description?</h2>
<p>A name should be short: what the thing is or does. Extra information, like a password rule or an error message, belongs in a description. <code>aria-describedby</code> works like aria-labelledby (a list of ids) but its text is read after the name and role, often after a short pause, and it does not replace the name. "Password, edit text, at least 12 characters" is much easier to follow than a name that contains the full rule.</p>

<h2 id="where-it-fails">Where neither attribute works</h2>
<p>Naming is only allowed on some roles. On a plain <code>&lt;div&gt;</code>, <code>&lt;span&gt;</code> or <code>&lt;p&gt;</code>, which have a generic or paragraph role, most screen readers ignore aria-label and aria-labelledby completely. The text you wrote is never heard. a11ymedic reports this as <code>aria-prohibited-label</code>. Put the text in the content (visible or visually hidden), or give the element a role that supports a name, such as <code>role="img"</code> for a graphic built from several elements or <code>role="group"</code> for a set of related controls.</p>
<pre data-lang="html" data-title="Prohibited name and fixes"><code>&lt;!-- Before: ignored by most screen readers --&gt;
&lt;div aria-label=&quot;4 out of 5 stars&quot;&gt;&lt;span class=&quot;star&quot;&gt;&lt;/span&gt;...&lt;/div&gt;

&lt;!-- After: a role that can be named --&gt;
&lt;div role=&quot;img&quot; aria-label=&quot;4 out of 5 stars&quot;&gt;&lt;span class=&quot;star&quot;&gt;&lt;/span&gt;...&lt;/div&gt;</code></pre>

<h2 id="mistakes">Common mistakes and how to catch them</h2>
<ul>
<li><strong>Visible text missing from the name.</strong> A button shows "Search" but its aria-label is "Find products". Voice control users say "click Search" and nothing happens. This fails <a href="https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html">2.5.3 Label in Name</a> and is caught by <code>label-in-name</code>. Start the name with the visible text, or drop the aria-label.</li>
<li><strong>Pointing to an id that does not exist.</strong> A typo in aria-labelledby gives an empty name. Duplicate ids are just as bad, because the browser uses the first match. The <code>duplicate-id</code> rule reports them.</li>
<li><strong>Repeating the content.</strong> <code>&lt;button aria-label="Save"&gt;Save&lt;/button&gt;</code> adds nothing and is one more thing to keep in sync. Remove it.</li>
<li><strong>Using aria-label to add instructions.</strong> That replaces the name. Use aria-describedby.</li>
<li><strong>Naming hidden content.</strong> An element with <code>aria-hidden="true"</code> is removed from the accessibility tree no matter what label it has.</li>
</ul>
<p>To see the name a browser would compute, use the developer tools accessibility panel, or call <code>accessibleName</code> from Node:</p>
<pre data-lang="js" data-title="Inspect accessible names"><code>import { parseHtml, accessibleName } from &quot;a11ymedic&quot;;

const { document } = await parseHtml(
  \`&lt;h2 id=&quot;t&quot;&gt;Delete file&lt;/h2&gt;
   &lt;div role=&quot;dialog&quot; aria-labelledby=&quot;t&quot;&gt;&lt;/div&gt;
   &lt;button aria-label=&quot;Close&quot;&gt;&lt;svg&gt;&lt;/svg&gt;&lt;/button&gt;\`
);

accessibleName(document.querySelector(&quot;[role=dialog]&quot;)); // &quot;Delete file&quot;
accessibleName(document.querySelector(&quot;button&quot;));        // &quot;Close&quot;</code></pre>
<p>For form fields specifically, see the <a href="accessible-form-labels.html">accessible form labels guide</a>. The full list of ARIA checks is in the <a href="./#rules">rules reference</a>.</p>
`,
    faq: [
      {
        q: "What is the difference between aria-label and aria-labelledby?",
        a: "aria-label contains the name as a string that is not visible on the page. aria-labelledby points to the id of one or more visible elements whose text becomes the name. Prefer aria-labelledby when the text is already on screen.",
      },
      {
        q: "Which wins if an element has both aria-label and aria-labelledby?",
        a: "aria-labelledby. In the accessible name calculation it comes first, and both of them override the native label and the element's own text.",
      },
      {
        q: "Can I use aria-label on a div?",
        a: "Not on a plain div or span. Their generic role does not support a name, so most screen readers ignore it. Give the div a role that can be named, such as img or group, or put the text in the content.",
      },
      {
        q: "When should I use aria-describedby instead of aria-label?",
        a: "Use aria-describedby for extra information such as hints, formats and error messages. It is read after the name and does not replace it, while aria-label replaces the name entirely.",
      },
    ],
    related: ["accessible-form-labels", "alt-text-best-practices", "wcag-2-2-checklist"],
  },

  {
    slug: "accessibility-overlay-vs-real-fixes",
    title: "Accessibility Overlay vs Real Fixes: What Actually Works",
    h1: "Accessibility overlay vs real fixes: what actually works",
    description:
      "Accessibility overlay vs real fixes: what runtime widgets can and cannot repair, why source fixes last longer, and how a diagnostic overlay fits a dev workflow.",
    keywords:
      "accessibility overlay vs real fixes, accessibility overlay, accessibility widget, fix accessibility in source code, wcag remediation, accessibility diagnostics",
    lead:
      "The word overlay means two very different things. Some overlays are scripts that try to repair a page for visitors while it runs. Others, like the a11ymedic overlay, only show developers what is wrong so they can fix the code. This guide compares the approaches fairly and explains why the lasting fix belongs in your source files.",
    body: `
<h2 id="two-kinds">Two kinds of overlay</h2>
<p>A <strong>runtime repair overlay</strong> is a script added to a production site. When a visitor loads the page, it scans the DOM and changes it: it adds attributes, generates alt text, adjusts colors, and often adds a toolbar with options such as bigger text, higher contrast or a reading guide. The promise is that a site becomes accessible without changing its code.</p>
<p>A <strong>diagnostic overlay</strong> is a tool for the people who build the site. It scans the page and shows the problems, but it does not change anything for visitors. The a11ymedic overlay is this second kind. It draws numbered pins on the elements that fail, and opens a side panel that explains each problem, who it affects, which WCAG criteria it fails, and the exact code to fix it. It never edits the page content, never invents alt text, and never changes colors on the live site.</p>

<h2 id="limits-of-runtime-repair">What runtime repair can and cannot do</h2>
<p>Some changes really can be made safely at runtime. Adding <code>lang="en"</code> to a page in English, or removing <code>user-scalable=no</code> from the viewport tag, needs no knowledge of the content. But most accessibility problems are about <strong>meaning</strong>, and meaning is not in the DOM:</p>
<ul>
<li><strong>Alt text.</strong> A script can guess that a photo shows "a person smiling". It cannot know that the photo is the new head of nursing, or that the chart shows signups doubling. A wrong description can be worse than none, because the user trusts it.</li>
<li><strong>Names of controls.</strong> An icon button with an SVG could mean close, delete, mute or collapse. Guessing wrong sends a screen reader user into the wrong action.</li>
<li><strong>Structure.</strong> Turning a styled <code>&lt;div&gt;</code> into a heading requires knowing which divs are headings and what level they are. Reading order, focus order and keyboard behavior of custom widgets are design decisions.</li>
<li><strong>Timing.</strong> Changes made after load can arrive late, be undone by a framework re rendering the component, or miss content that appears later in a single page app.</li>
<li><strong>Conflicts with the user's own tools.</strong> Disabled people usually already have assistive technology set up the way they like: a screen reader, magnification, high contrast mode, custom fonts or browser zoom. An extra layer that changes the page or the keyboard behavior can interfere with those settings rather than help.</li>
</ul>
<p>There is also a simple practical point. WCAG describes the content you deliver. If the HTML your server sends has unlabeled fields, every channel that consumes it (search engines, reader modes, other browsers, scripts that fail to load) still gets unlabeled fields. Many accessibility practitioners and disabled users have raised these concerns, which is why the guidance from standards bodies centers on fixing the content itself.</p>

<h2 id="toolbars">What about preference toolbars?</h2>
<p>Controls for text size, spacing or contrast are not harmful in themselves, and some audiences like them. But they repeat features that browsers and operating systems already provide, and that people already know how to use. More importantly, they do not address the barriers in the code. A form with no labels is still a form with no labels at 150 percent zoom. If you offer such controls, treat them as an extra, never as the way you meet WCAG.</p>

<h2 id="fix-the-source">Why fixing the source wins</h2>
<p>A fix in the source is made once, by someone who knows what the content means, and then it works for everyone, everywhere, with no extra script for visitors to download. It also teaches the team: a developer who adds a label to a field today writes the next form correctly. Most fixes are small:</p>
<pre data-lang="html" data-title="Real fixes are usually one attribute"><code>&lt;!-- Before --&gt;
&lt;button&gt;&lt;svg&gt;...&lt;/svg&gt;&lt;/button&gt;
&lt;input type=&quot;email&quot; placeholder=&quot;Email&quot;&gt;
&lt;img src=&quot;divider.png&quot;&gt;

&lt;!-- After --&gt;
&lt;button aria-label=&quot;Close&quot;&gt;&lt;svg aria-hidden=&quot;true&quot;&gt;...&lt;/svg&gt;&lt;/button&gt;
&lt;label for=&quot;email&quot;&gt;Email&lt;/label&gt;
&lt;input type=&quot;email&quot; id=&quot;email&quot; autocomplete=&quot;email&quot;&gt;
&lt;img src=&quot;divider.png&quot; alt=&quot;&quot;&gt;</code></pre>
<p>Fixing at the component and design token level multiplies the effect. One corrected button component, or one darker gray in your color tokens (see the <a href="how-to-fix-color-contrast.html">color contrast guide</a>), can clear hundreds of findings across a site.</p>

<h2 id="diagnose-then-fix">A workflow: diagnose in the page, fix in the code</h2>
<p>The a11ymedic overlay is meant for development, staging and design reviews. Load it on a local or preview build, look at the pins, open the panel with the keyboard, and copy the fix into your component. Alt+Shift+A shows or hides it. Because it runs in a real browser, it uses computed styles and real element sizes, which makes it the most accurate way to check contrast and target size.</p>
<pre data-lang="html" data-title="Load the overlay on a preview build"><code>&lt;script src=&quot;https://cdn.jsdelivr.net/npm/a11ymedic@0.1.0/dist/a11ymedic.js&quot; data-overlay&gt;&lt;/script&gt;</code></pre>
<pre data-lang="js" data-title="Only on localhost"><code>if (location.hostname === &quot;localhost&quot;) {
  const s = document.createElement(&quot;script&quot;);
  s.src = &quot;https://cdn.jsdelivr.net/npm/a11ymedic@0.1.0/dist/a11ymedic.js&quot;;
  s.dataset.overlay = &quot;&quot;;
  document.head.append(s);
}</code></pre>
<p>For changes that need no human decision, let the CLI edit the files for you. It applies only safe fixes (empty alt on images that are clearly decorative, a page language it can detect, removed zoom blocking, labels for tab panels) and leaves anything that needs judgment, such as writing a real description, for a person.</p>
<pre data-lang="sh" data-title="Apply safe fixes to the source"><code># Preview the changes as a diff
npx a11ymedic fix &quot;src/**/*.html&quot;

# Write them to disk, then review with git diff
npx a11ymedic fix &quot;src/**/*.html&quot; --write</code></pre>
<p>Finally, keep the fixes from regressing with a check in your pipeline, as shown in the <a href="accessibility-testing-in-ci.html">CI guide</a>.</p>

<h2 id="third-party">When you cannot change the code</h2>
<p>Sometimes the problem is in a third party embed, a legacy CMS template or a vendor widget. Runtime patching is tempting there, but it is still fragile. Better options, roughly in order: fix the template that generates the markup; ask the vendor for an accessible version and share the a11ymedic report as evidence (the HTML and Markdown reports are easy to attach); replace the component; and as a last resort, patch the markup at build time, where the change is versioned and testable, instead of in every visitor's browser. Use <code>--exclude</code> with a CSS selector to keep known third party areas out of your CI gate while you work on it, so the rest of the site stays protected.</p>
<p>To start, run the <a href="./#checkup">online check-up</a> on a snippet or read the <a href="website-accessibility-checker.html">website accessibility checker guide</a>.</p>
`,
    faq: [
      {
        q: "Do accessibility overlays make a website WCAG compliant?",
        a: "A script that changes the page at runtime cannot supply meaning it does not know, such as accurate alt text, control names or heading structure. Conformance depends on the content you deliver, so the reliable path is fixing the source code.",
      },
      {
        q: "Does the a11ymedic overlay change my website for visitors?",
        a: "No. It is a diagnostic tool. It shows numbered pins and a panel with explanations and fixes, but it never edits the content, colors or behavior of the page. It is meant for development and review builds.",
      },
      {
        q: "Can accessibility issues be fixed automatically?",
        a: "Some can. Changes that need no knowledge of the content, such as an empty alt on a clearly decorative image or a missing page language, are applied by a11ymedic fix with the write option. Descriptions and names still need a person.",
      },
    ],
    related: ["website-accessibility-checker", "accessibility-testing-in-ci", "alt-text-best-practices"],
  },
];
