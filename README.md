# Atithya Events Thane

The marketing website for Atithya Events Thane, a boutique events studio that
plans weddings, birthdays, baby showers, anniversaries, engagements and
corporate celebrations.

Content lives in **Sanity CMS** and is baked into static HTML at build time, so
the published site is plain files on a CDN — fast, cheap to host, and fully
visible to Google and to WhatsApp link previews.

---

## Quick start

```bash
npm install          # once
npm run dev          # build + serve on http://localhost:8080
```

With no Sanity credentials set, the build uses `content/fallback.json` — a
snapshot of the copy the site shipped with. That means the site always builds,
even before the CMS is connected.

```bash
npm run build        # write dist/
npm run studio       # open the Sanity Studio (after studio setup, below)
```

---

## How content reaches the page

```
  Editor publishes in Sanity
        │
        ▼  webhook
  Netlify runs `npm run build`
        │
        ▼
  scripts/build.js  ──  Sanity ──► src/index.template.html ──► dist/index.html
        │
        ▼
  Static files on the CDN
```

`dist/` is the deployable output. Never edit it — it is deleted and rewritten
on every build.

**Where content comes from**, in order:

1. If `SANITY_PROJECT_ID` is set, the build fetches from Sanity. If Sanity is
   configured but unreachable or empty, the build **fails loudly** rather than
   publishing a half-empty page.
2. Otherwise it uses `content/fallback.json`.

---

## Project structure

```
.
├── index.html                  Original hand-written page. Reference only —
│                                 the build does NOT read this. See note below.
├── src/
│   └── index.template.html     The real template (Handlebars). Edit for DESIGN.
├── content/
│   └── fallback.json           Content snapshot used when Sanity is not set up.
├── scripts/
│   ├── build.js                Sanity (or fallback) + template → dist/
│   ├── extract-content.js      One-time: index.html → fallback.json
│   ├── import-to-sanity.js     One-time: fallback.json → Sanity (incl. photos)
│   └── serve.js                Local preview server, no dependencies
├── studio/                     Sanity Studio (the editing UI)
│   ├── sanity.config.js
│   └── schemaTypes/
│       ├── singletons.js       Contact, SEO, home-page copy
│       └── collections.js      Categories, portfolio, FAQs, testimonials …
├── assets/                     CSS, JS, images — copied to dist/ untouched
│   ├── css/                    Loaded in numeric order — the order matters
│   │   ├── 01-tokens.css       Colours, fonts, spacing, easing
│   │   ├── 02-base.css         Reset, layout containers, type scale
│   │   ├── 03-components.css   Buttons, links, frames, motion primitives
│   │   ├── 04-sections.css     One block per page section
│   │   └── 05-utilities.css    Reduced-motion and print rules
│   ├── js/
│   │   ├── site.config.js      GENERATED at build time — do not hand-edit
│   │   └── main.js             All behaviour
│   └── images/
├── netlify.toml                Deploy config
└── dist/                       Build output (gitignored)
```

> **About `index.html`:** it is kept as the original reference and as the input
> to `extract-content.js`. The build reads `src/index.template.html` instead.
> If you change design markup, change the **template** — editing `index.html`
> alone has no effect on the published site.

---

### Why the CSS is split across five files

Each file owns one layer of the cascade, from most general to most specific.
They are linked in `index.html` in numeric order:

```html
<link rel="stylesheet" href="assets/css/01-tokens.css">
<link rel="stylesheet" href="assets/css/02-base.css">
<link rel="stylesheet" href="assets/css/03-components.css">
<link rel="stylesheet" href="assets/css/04-sections.css">
<link rel="stylesheet" href="assets/css/05-utilities.css">
```

**Do not reorder those tags.** `05-utilities.css` in particular must load last,
because its reduced-motion and print rules rely on `!important` winning.

The original numbered section comments (`1. Design tokens` … `23. Preferences &
print`) are preserved inside the files, so older notes that refer to "section
14" still line up.

---

## Connecting Sanity

The Studio in `studio/` is already configured for this project:

| | |
| ------------ | ------------ |
| Project ID   | `dzj440zw`   |
| Dataset      | `production` |

Set in `studio/sanity.config.js`, `studio/sanity.cli.js` and the root `.env`.
Environment variables still override them, so a `staging` dataset needs no code
change — set `SANITY_STUDIO_DATASET` / `SANITY_DATASET`.

> Do **not** run `npm create sanity@latest`. That scaffolds a second Studio and
> would discard the schemas in `studio/schemaTypes/`.

### 1. Install the Studio (once)

```bash
cd studio
npm install
cd ..
```

### 2. Import the content you already have

Create an **Editor** token at *sanity.io/manage → dzj440zw → API → Tokens*,
paste it into `.env` as `SANITY_TOKEN=`, then:

```bash
npm run import
```

This uploads all 41 photos and creates every document — categories, portfolio,
services, FAQs, testimonials, contact details, SEO. Nothing is retyped.

Safe to re-run: documents use fixed ids, so it overwrites rather than
duplicates. Add `--skip-images` to skip re-uploading photos.

### 3. Edit and rebuild

```bash
npm run studio       # editing UI at http://localhost:3333
npm run build        # regenerate dist/ from Sanity
npm run dev          # build + preview at http://localhost:8080
```

The build reads `.env`, so no environment variables need setting by hand.

To give someone a hosted editing URL instead of running it locally:

```bash
cd studio && npm run deploy     # → https://<name>.sanity.studio
```

---

## What is editable in the CMS

| Sidebar entry         | What it controls                                    |
| --------------------- | --------------------------------------------------- |
| **Contact & Brand**   | Wordmark, phone, email, WhatsApp number, city, Instagram |
| **SEO & Sharing**     | Tab title, meta description, share image and text    |
| **Home Page Copy**    | Hero, story, stats, closing CTA, footer              |
| **Event Categories**  | The 8 categories and their photos                    |
| **Featured Events**   | The 4 large case studies                             |
| **Services**          | The 6 service entries                                |
| **Experience Steps**  | The 5 steps on the dark timeline                     |
| **Portfolio**         | The 15 tiles, their photos and filter category       |
| **Portfolio Filters** | The filter buttons above the grid                    |
| **Why Choose Us**     | The 6 points                                         |
| **How It Works**      | The 4 process steps                                  |
| **Testimonials**      | Client quotes                                        |
| **FAQs**              | Questions and answers                                |

Every collection has an **Order** number — lower numbers appear first, so
reordering is just renumbering.

**Not in the CMS** (they are design, not content): the navigation labels, the
enquiry-form fields, and the section headings that are structural. Those live in
`src/index.template.html`.

### Contact details

These come from **Contact & Brand** in Sanity and are written into
`dist/assets/js/site.config.js` at build time. At page load `main.js` fills in
every element carrying these attributes:

| Attribute        | What it does                                             |
| ---------------- | -------------------------------------------------------- |
| `data-site="…"`  | Replaces the text with the matching config value          |
| `data-href="…"`  | Builds a `tel:`, `mailto:` or Instagram link              |
| `data-wa-direct` | Builds a `wa.me` link carrying `directMessage`            |
| `data-year`      | Fills in the current year (used in the footer copyright)  |

> **`whatsappNumber` must be digits only.** `91` is the India country code,
> followed by the 10-digit number. A `+`, space or hyphen will break the link.
> The Studio enforces this with a validation rule.

### Colours and fonts

Design, not content — change them in `assets/css/01-tokens.css` and the whole
site follows:

```css
:root{
  --ivory:#FBF8F3;    /* page background */
  --ink:#16130F;      /* headings, dark sections */
  --gold:#A98442;     /* accent */
  --body:#4C443A;     /* body text */
}
```

Nothing else in the stylesheets hard-codes a colour. If you change a text
colour, re-check contrast — the current values are annotated where they sit
close to the WCAG AA threshold.

Fonts are **Fraunces** (headings) and **Jost** (body), from Google Fonts.

### Images

Once Sanity is connected, photos are uploaded through the Studio and served
from Sanity's image CDN, which crops and resizes them automatically — no need
to prepare multiple sizes. Before that, they are the original Unsplash / Pexels
URLs. See `assets/images/README.md`.

---

## How the enquiry form works

**There is no backend and no database.** The form is a WhatsApp composer:

1. The visitor fills in name, phone, event type, date, location, guests, budget
   and notes.
2. On submit, `main.js` validates the fields inline and focuses the first
   problem it finds.
3. It formats the answers into a readable message and opens
   `https://wa.me/<your number>?text=<the message>` in a new tab — the app on
   mobile, WhatsApp Web on desktop.
4. **The visitor presses Send themselves.** Nothing is transmitted until they do.
5. If the browser blocks the pop-up, the page shows the composed message with an
   "Open WhatsApp" button and a copy-to-clipboard fallback.

Enquiries therefore arrive in your WhatsApp inbox. Nothing is stored on the
site, which also means there is no form data to secure or back up.

To route enquiries to a real backend or email service instead, replace the
`form.addEventListener("submit", …)` handler near the end of `main.js`.

---

## Accessibility and performance notes

The site already does a number of things worth not breaking:

- **Skip link** to main content, plus a visually-hidden `.vh` utility class.
- **Keyboard support** — the mobile drawer traps focus and closes on `Escape`.
- **`aria-labelledby`** on every section, tied to its heading.
- **`prefers-reduced-motion`** is honoured; all animation collapses to near-zero.
- **`<noscript>`** styles reveal any content that animation would otherwise hide,
  so the page is fully readable with JavaScript disabled.
- **Print stylesheet** hides the nav, drawer and floating button.

When adding markup, give new sections a heading and an `aria-labelledby`, and
add `data-reveal` only to things that are still readable if the script never
runs.

---

## Deploying

Push to Git and connect the repo to **Netlify** (or Vercel / Cloudflare Pages).
`netlify.toml` already sets the build command (`npm run build`) and publish
directory (`dist`).

Then, under *Site settings → Environment variables*, add:

| Variable            | Value                                |
| ------------------- | ------------------------------------ |
| `SANITY_PROJECT_ID` | your project id                      |
| `SANITY_DATASET`    | `production` (only if different)     |
| `SANITY_TOKEN`      | only if the dataset is private       |

### Rebuild when content changes

A publish in Sanity does not by itself update the live site — the build has to
re-run. Wire it up once:

1. Netlify → *Build & deploy → Build hooks* → **Add build hook**. Copy the URL.
2. Sanity → *sanity.io/manage → API → Webhooks* → **Create webhook**, paste the
   URL, set the trigger to *Create / Update / Delete*.

Publishing then rebuilds the site in roughly 30 seconds.

**Still a placeholder:** the email address (`hello@atithyaevents.in`) and the
site URL (`https://example.com/`). Both are now editable in the Studio under
*Contact & Brand* and *SEO & Sharing* — set them before launch.

---

## Version control

The project is not yet a Git repository. To start tracking changes:

```bash
git init
git add .
git commit -m "Initial commit: Atithya Events Thane site"
```

`.gitignore` already covers OS noise, editor files, `node_modules/`, `dist/`
and Sanity's local cache. Commit `content/fallback.json` — it is the safety net
that lets the site build if Sanity is ever unreachable.

---

## Conventions

- Two-space indentation everywhere (enforced by `.editorconfig`).
- CSS class names follow a loose BEM style: `.block__element--modifier`.
- Browser JavaScript (`assets/js/main.js`) is plain ES5-era syntax (`var`,
  `function`) and ships unbundled — match that style. Build scripts under
  `scripts/` run in Node 20 and can use modern syntax freely.
- Design markup changes go in `src/index.template.html`, not `index.html`.
- Keep the numbered section comments in the CSS up to date if you add a section.
