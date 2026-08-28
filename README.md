# The Skyward Project — website

A static site. No build step, no dependencies. Every page is a plain HTML file
you can open and edit in any text editor.

## Files

```
index.html          Home (masthead, thesis, city plate, three columns, core team)
mission.html        The Mission
finlit-index.html   The FinLit Index
take-the-test.html  Public student landing page for the online paper
test.html           The 27-question practice test (email required)
dispatches.html     Dispatches (placeholder)
field-notes.html    Field Notes (placeholder)
contact.html        Contact form
thank-you.html      Shown after the form is sent
styles.css          All styling
script.js           Navigation, scroll effects, contact form
assets/             Emblem, plates, photos, favicon
```

## Reverting to the version before illustrations

A complete copy of the site as it stood just before the engraved plates were
added lives next to this folder:

```
/Users/verushka/The Skyward Project — before illustrations
```

To go back, copy those files over this folder (or open that folder instead).
Do not delete that copy until you are sure you want to keep the illustrated
version.

The team lives on the home page, below the three-column introduction. There is
no separate team page.

The navigation is a thin fixed bar across the top, carrying the emblem and seven
links. The emblem is also shown beside the homepage wordmark (display only).
On the home page the bar stays hidden until the masthead scrolls out of view,
then fades in; every other page shows it immediately and adds
`class="has-fixed-nav"` to `<body>` so the content clears it. The bar is the
same block of HTML in each file — if you add a page, paste the block in and set
`aria-current="page"` on the matching item.

## Contact form

Letters from the site go to `verushka@theskywardproject.com` through FormSubmit.
The first submission sends a confirmation to that inbox — open it and click
the link once, or later messages will not arrive.

## Viewing it locally

Double-clicking `index.html` works. To see it exactly as a visitor would, run
this in Terminal from inside this folder and open http://localhost:8000:

```bash
python3 -m http.server 8000
```

## Publishing

**Netlify (easiest):** go to [app.netlify.com/drop](https://app.netlify.com/drop)
and drag this whole folder onto the page. It goes live in seconds at a
temporary address, and you can attach a custom domain later.

**Vercel:** [vercel.com/new](https://vercel.com/new) — choose "deploy without a
framework" and upload the folder. No build command, no output directory.

Either host will serve the site for free. To update anything later, edit the
file and re-upload.

## Editing conventions

- Colours, fonts and spacing all live in the `:root` block at the top of
  `styles.css`. Change a value there and it updates everywhere — including the
  navy ground, the gold accent, and the hairline rules.
- Small uppercase labels are `<p class="eyebrow">`; they draw their own short
  gold rule automatically.
- Dividers: `<hr class="rule">` for a single hairline,
  `<div class="rule--double"></div>` for the broadsheet double rule.
- Article cards are `<article class="card">`. To publish a real Dispatch or
  Field Note, copy an existing card block and edit the text inside it.
- Team photos: see `assets/README.txt`.

## Scroll effects

`script.js` reveals content as it scrolls into view: headlines and statements
rise a word at a time, blocks fade up one after another, and hairlines draw in
from the left. A gold progress line tracks reading position along the bottom of
the navigation bar.

You do not need to mark anything up for this. The script finds the elements by
their existing classes and adds the animation classes itself, which means two
things worth knowing:

- If JavaScript is off, nothing is ever hidden — the page simply renders
  static. The contact form still posts.
- If a visitor's system asks for reduced motion, the script skips the effects
  entirely rather than animating faster.

To add a new animated group, extend the list of selectors near the top of the
reveals section in `script.js`.
