// Long form guides for the a11ymedic site. Each body is HTML; code samples are HTML escaped.

export const GUIDES = [
  {
    slug: "how-to-fix-color-contrast",
    title: "Fixing color contrast | a11ymedic",
    h1: "Fixing color contrast and keeping your brand colors",
    description:
      "The WCAG contrast ratios, the traps that hide failing text, and how to pick a passing color close to the one you have.",
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
    related: ["alt-text-best-practices", "accessible-form-labels"],
  },

  {
    slug: "alt-text-best-practices",
    title: "Writing alt text | a11ymedic",
    h1: "Writing alt text for every kind of image",
    description:
      "When to describe an image and when to leave alt empty, with examples for links, buttons, icons, charts and SVG.",
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
    related: ["accessible-form-labels", "how-to-fix-color-contrast"],
  },

  {
    slug: "accessible-form-labels",
    title: "Labeling form fields | a11ymedic",
    h1: "Labeling form fields",
    description:
      "Visible labels, groups of options, hints and errors, and autocomplete for every kind of form field.",
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
<p>Some fields have a clear visual context, such as a search box next to a "Search" button. In that case an <code>aria-label</code> or <code>aria-labelledby</code> pointing at the button text is acceptable. Treat this as the exception. A visible label helps everyone, including people who do not use assistive technology. If you do use <code>aria-label</code> on a control that has visible text, the name must contain that text, ideally at the start. Otherwise voice control users who say what they see get no response. That is 2.5.3 Label in Name, checked by <code>label-in-name</code>. In short, <code>aria-label</code> holds the name as text, while <code>aria-labelledby</code> points at visible elements whose text becomes the name.</p>

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
    related: ["alt-text-best-practices", "accessibility-testing-in-ci"],
  },

  {
    slug: "accessibility-testing-in-ci",
    title: "Running a11ymedic in CI | a11ymedic",
    h1: "Running accessibility checks in CI",
    description:
      "Fail a build on serious problems, get annotations on pull requests, and test components with Vitest or Jest.",
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
<p>Pair the gate with a short manual pass on every release: keyboard only, zoom to 200 percent, and a screen reader check on the main flows. The <a href="wcag-cheat-sheet.html">WCAG 2.2 cheat sheet</a> marks which items need that human review, and the <a href="./#install">install section</a> covers every setup.</p>
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
    related: ["how-to-fix-color-contrast", "accessible-form-labels"],
  },
];
