/**
 * ATITHYA EVENTS THANE — one-time content extractor
 *
 * Reads the hand-written index.html and lifts every editable string and image
 * out of it into content/fallback.json.
 *
 * You normally run this ONCE, to seed the CMS with the copy the site already
 * has. After that, Sanity is the source of truth and this script is only kept
 * around for reference.
 *
 *   node scripts/extract-content.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/* ---------------------------------------------------------------- helpers */

const ENTITIES = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
  '&#x27;': "'", '&nbsp;': '\u00a0', '&middot;': '\u00b7', '&copy;': '\u00a9',
  '&mdash;': '\u2014', '&ndash;': '\u2013', '&hellip;': '\u2026',
};

/** Decode entities so Handlebars can re-encode them on output. */
function decode(s) {
  if (s == null) return s;
  return String(s).replace(/&(?:amp|lt|gt|quot|#39|#x27|nbsp|middot|copy|mdash|ndash|hellip);/g,
    (m) => ENTITIES[m] != null ? ENTITIES[m] : m);
}

/** Collapse the multi-line indentation used inside <p> blocks. */
function text(s) {
  return decode(String(s || '').replace(/\s+/g, ' ').trim());
}

/** Strip tags, keep the text. */
function plain(s) {
  return text(String(s || '').replace(/<[^>]*>/g, ''));
}

function attr(tag, name) {
  const m = tag.match(new RegExp(name + '="([^"]*)"'));
  return m ? decode(m[1]) : undefined;
}

/** Turn an <img …> tag into a normalised image object. */
function image(tag) {
  if (!tag) return null;
  const img = {
    src: attr(tag, 'src'),
    alt: attr(tag, 'alt') || '',
  };
  const srcset = attr(tag, 'srcset');
  const sizes = attr(tag, 'sizes');
  const width = attr(tag, 'width');
  const height = attr(tag, 'height');
  if (srcset) img.srcset = srcset.replace(/\s+/g, ' ').trim();
  if (sizes) img.sizes = sizes;
  if (width) img.width = Number(width);
  if (height) img.height = Number(height);
  return img;
}

/** Return every match of a global regex as an array of match arrays. */
function all(re, s) {
  const out = [];
  let m;
  while ((m = re.exec(s)) !== null) out.push(m);
  return out;
}

function section(startRe, endRe) {
  const a = html.search(startRe);
  if (a < 0) return '';
  const rest = html.slice(a);
  const b = rest.search(endRe);
  return b < 0 ? rest : rest.slice(0, b);
}

/* ------------------------------------------------------------ site config */

const cfg = fs.readFileSync(path.join(ROOT, 'assets/js/site.config.js'), 'utf8');
function cfgVal(key) {
  const m = cfg.match(new RegExp(key + '\\s*:\\s*"([^"]*)"'));
  return m ? m[1] : '';
}

const content = {};

content.site = {
  brandMark: plain(html.match(/<span class="brand__mark">([\s\S]*?)<\/span>/)[1]),
  brandSub: plain(html.match(/<span class="brand__sub">([\s\S]*?)<\/span>/)[1]),
  brandFull: attr(html.match(/<a class="brand"[^>]*>/)[0], 'aria-label').replace(/\s*—\s*home$/, ''),
  whatsappNumber: cfgVal('whatsappNumber'),
  phone: cfgVal('phone'),
  email: cfgVal('email'),
  city: cfgVal('city'),
  instagram: cfgVal('instagram'),
  directMessage: cfgVal('directMessage'),
};

content.seo = {
  title: plain(html.match(/<title>([\s\S]*?)<\/title>/)[1]),
  description: attr(html.match(/<meta name="description"[^>]*>/)[0], 'content'),
  canonical: attr(html.match(/<link rel="canonical"[^>]*>/)[0], 'href'),
  ogSiteName: attr(html.match(/<meta property="og:site_name"[^>]*>/)[0], 'content'),
  ogTitle: attr(html.match(/<meta property="og:title"[^>]*>/)[0], 'content'),
  ogDescription: attr(html.match(/<meta property="og:description"[^>]*>/)[0], 'content'),
  ogImage: attr(html.match(/<meta property="og:image"[^>]*>/)[0], 'content'),
  ogImageAlt: attr(html.match(/<meta property="og:image:alt"[^>]*>/)[0], 'content'),
  themeColor: attr(html.match(/<meta name="theme-color"[^>]*>/)[0], 'content'),
};

/* -------------------------------------------------------------------- hero */

const heroBlock = section(/<section class="hero"/, /<\/section>/);
content.hero = {
  image: image(heroBlock.match(/<img[^>]*>/)[0]),
  eyebrow: plain(heroBlock.match(/<p class="eyebrow hero__eyebrow">([\s\S]*?)<span aria-hidden/)[1]),
  headlineLines: all(/<span class="line-mask"[^>]*><span>([\s\S]*?)<\/span><\/span>/g, heroBlock)
    .map((m) => m[1].trim()),
  copy: text(heroBlock.match(/<p class="hero__copy"[^>]*>([\s\S]*?)<\/p>/)[1]),
  buttons: all(/<a class="btn btn--(light|onDark)" href="([^"]+)">([\s\S]*?)<\/a>/g, heroBlock)
    .map((m) => ({ style: m[1], href: m[2], label: plain(m[3]) })),
  tags: all(/<span>([^<]+)<\/span>/g,
    heroBlock.match(/<div class="hero__tags">([\s\S]*?)<\/div>/)[1]).map((m) => plain(m[1])),
};

/* ------------------------------------------------------- event categories */

const catsBlock = section(/<ul class="cats__list"/, /<\/ul>/);
content.categories = all(
  /<span class="cat__thumb"><img([^>]*)>[\s\S]*?<span class="cat__num">([^<]*)<\/span>[\s\S]*?<span class="cat__name">([^<]*)<\/span>\s*<span class="cat__desc">([\s\S]*?)<\/span>/g,
  catsBlock
).map((m) => ({
  num: plain(m[2]),
  name: plain(m[3]),
  desc: text(m[4]),
  image: image('<img' + m[1] + '>'),
}));

content.categoriesHeading = {
  eyebrow: plain((html.match(/<span class="eyebrow__num">01<\/span>([^<]*)</) || [, ''])[1]),
};

/* ------------------------------------------------------------------ story */

const storyBlock = section(/<div class="story__body">/, /<\/section>/);
content.story = {
  eyebrow: plain(storyBlock.match(/<span class="eyebrow__num">02<\/span>([^<]*)</)[1]),
  heading: decode(storyBlock.match(/<h2 class="d2"[^>]*>([\s\S]*?)<\/h2>/)[1].trim()),
  paragraphs: all(/<p(?: class="lede")? data-reveal style="--i:\d"[^>]*>([\s\S]*?)<\/p>/g, storyBlock)
    .map((m) => text(m[1])),
  signature: plain(storyBlock.match(/<p class="story__sig"[^>]*>([\s\S]*?)<span data-site/)[1])
    .replace(/,\s*$/, ''),
  stats: all(/<dt class="stat__n">([\s\S]*?)<\/dt><dd class="stat__l">([^<]*)<\/dd>/g, storyBlock)
    .map((m) => ({ value: plain(m[1]), label: plain(m[2]) })),
  images: all(/<img[^>]*>/g, section(/<div class="story__media"/, /<div class="story__body">/))
    .map((m) => image(m[0])),
};

/* ---------------------------------------------------------------- header */

const navBlock = section(/<header class="nav"/, /<\/header>/);
const drawerBlock = section(/<div class="drawer"/, /<\/nav>/);
const drawerFoot = section(/<div class="drawer__foot">/, /<\/div>\n<\/div>/);

content.header = {
  // No logo image today — the header uses the text wordmark. Upload one in
  // Sanity and it replaces the wordmark; leave it empty to keep the wordmark.
  logo: null,
  navLinks: all(/<a class="nav__link" href="([^"]*)">([^<]*)<\/a>/g, navBlock)
    .map((m) => ({ href: m[1], label: plain(m[2]) })),
  cta: (function () {
    const m = navBlock.match(/<a class="btn btn--onDark nav__cta" href="([^"]*)">([^<]*)<\/a>/);
    return m ? { href: m[1], label: plain(m[2]) } : { href: '#enquiry', label: 'Plan Your Event' };
  })(),
  drawerCtaLabel: plain((drawerFoot.match(/<a class="btn btn--wide" href="[^"]*">([^<]*)<\/a>/) || [, ''])[1]),
  drawerWhatsappLabel: plain((drawerFoot.match(/<a class="btn btn--ghost btn--wide"[^>]*>([^<]*)<\/a>/) || [, ''])[1]),
};

/* --------------------------------------------------------------- socials */

content.social = [];
if (/<a data-href="instagram"/.test(html)) {
  content.social.push({platform: 'instagram', url: content.site.instagram});
}
if (/data-wa-direct aria-label="Chat with/.test(html)) {
  content.social.push({platform: 'whatsapp', url: ''});
}

/* -------------------------------------------------------- featured events */

content.featured = all(
  /<article class="feat__item([^"]*)"[^>]*>\s*<div class="feat__media"><div class="frame frame--wide">\s*<img([^>]*)>[\s\S]*?<p class="feat__meta">([\s\S]*?)<\/p>\s*<h3 class="d3">([^<]*)<\/h3>\s*<p>([\s\S]*?)<\/p>\s*<a class="link-u" href="([^"]*)">([\s\S]*?)<span/g,
  html
).map((m) => ({
  flip: /--flip/.test(m[1]),
  image: image('<img' + m[2] + '>'),
  meta: all(/<span>([^<]*)<\/span>/g, m[3]).map((x) => plain(x[1])),
  title: plain(m[4]),
  body: text(m[5]),
  linkHref: m[6],
  linkLabel: plain(m[7]),
}));

/* --------------------------------------------------------------- services */

content.services = all(
  /<li class="svc__item"[^>]*>\s*<span class="svc__n">([^<]*)<\/span>\s*<div>\s*<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g,
  html
).map((m) => ({ num: plain(m[1]), title: plain(m[2]), body: text(m[3]) }));

/* --------------------------------------------------- signature experience */

content.experience = all(
  /<li class="exp__step[^"]*">\s*<span class="exp__dot"[^>]*><i><\/i><\/span>\s*<div><h3>([^<]*)<\/h3><p>([\s\S]*?)<\/p><\/div>/g,
  html
).map((m) => ({ title: plain(m[1]), body: text(m[2]) }));

/* -------------------------------------------------------------- portfolio */

content.portfolio = all(
  /<figure class="tile" data-cat="([^"]*)"[^>]*>\s*<div class="tile__frame">\s*<img([^>]*)>[\s\S]*?<span class="tile__t">([^<]*)<\/span><span class="tile__s">([^<]*)<\/span>/g,
  html
).map((m) => ({
  category: m[1],
  image: image('<img' + m[2] + '>'),
  title: plain(m[3]),
  subtitle: plain(m[4]),
}));

content.portfolioFilters = all(
  /<button class="filter[^"]*"[^>]*data-filter="([^"]*)"[^>]*>([^<]*)<\/button>/g,
  html
).map((m) => ({ value: m[1], label: plain(m[2]) }));

/* ------------------------------------------------------------- why choose */

content.why = all(
  /<div class="why__item"[^>]*><span class="why__n">([^<]*)<\/span><h3>([^<]*)<\/h3><p>([\s\S]*?)<\/p><\/div>/g,
  html
).map((m) => ({ num: plain(m[1]), title: plain(m[2]), body: text(m[3]) }));

/* ---------------------------------------------------------------- process */

content.process = all(
  /<div class="step"[^>]*>\s*<span class="step__mark"[^>]*><\/span>\s*<p class="step__n">([^<]*)<\/p><h3>([^<]*)<\/h3>\s*<p>([\s\S]*?)<\/p>/g,
  html
).map((m) => ({ num: plain(m[1]), title: plain(m[2]), body: text(m[3]) }));

/* ----------------------------------------------------------- testimonials */

content.testimonials = all(
  /<blockquote><p>([\s\S]*?)<\/p><\/blockquote>[\s\S]*?<span class="quote__name">([^<]*)<\/span>\s*<span class="quote__ev">([^<]*)<\/span>/g,
  html
).map((m) => ({ quote: text(m[1]), name: plain(m[2]), event: plain(m[3]) }));

/* -------------------------------------------------------------------- faq */

content.faqs = all(
  /<button class="acc__btn"[^>]*>\s*([\s\S]*?)<span class="acc__ico"[\s\S]*?<div class="acc__panel"[^>]*><div>\s*<p>([\s\S]*?)<\/p>/g,
  html
).map((m) => ({ question: text(m[1]), answer: text(m[2]) }));

/* -------------------------------------------------------------- final CTA */

const ctaBlock = section(/<section class="cta"/, /<\/section>/);
content.cta = {
  image: image(ctaBlock.match(/<img[^>]*>/)[0]),
  eyebrow: plain(ctaBlock.match(/<p class="eyebrow cta__eyebrow"[^>]*>([\s\S]*?)<\/p>/)[1]),
  heading: decode(ctaBlock.match(/<h2[^>]*id="cta-h"[^>]*>([\s\S]*?)<\/h2>/)[1].trim()),
  body: text(ctaBlock.match(/<p data-reveal style="--i:2">([\s\S]*?)<\/p>/)[1]),
  buttons: all(/<a class="btn btn--(light|onDark)"[^>]*href="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/g, ctaBlock)
    .map((m) => ({ style: m[1], href: m[2], whatsapp: /data-wa-direct/.test(m[3]), label: plain(m[4]) })),
};

/* ----------------------------------------------------------------- footer */

const footBlock = section(/<footer class="foot">/, /<\/footer>/);
content.footer = {
  word: plain(footBlock.match(/<p class="foot__word">([\s\S]*?)<i/)[1]),
  blurb: text(footBlock.match(/<p>(A boutique[\s\S]*?)<\/p>/)[1]
    .replace(/<span data-site="city">[\s\S]*?<\/span>/, '{{CITY}}')),
  columns: all(/<h4>([^<]*)<\/h4>\s*<ul class="foot__list">([\s\S]*?)<\/ul>/g, footBlock)
    .map((m) => ({
      heading: plain(m[1]),
      links: all(/<li><a href="([^"]*)">([^<]*)<\/a><\/li>/g, m[2])
        .map((l) => ({ href: l[1], label: plain(l[2]) })),
    })),
  legal: plain(footBlock.match(/<p>&copy;[\s\S]*?<\/span>([^<]*)<\/p>/)[1]).replace(/^\s*/, ''),
  credit: plain((footBlock.match(/<p>(Designed[^<]*)<\/p>/) || [, ''])[1]),
  logo: null,
  contactHeading: plain((footBlock.match(/<h4>(Get in touch)<\/h4>/) || [, 'Get in touch'])[1]),
  ctaLabel: plain((footBlock.match(/<a class="btn btn--onDark"[^>]*data-wa-direct>([^<]*)<\/a>/) || [, ''])[1]),
};

/* ------------------------------------------------------------------ write */

const outDir = path.join(ROOT, 'content');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'fallback.json');
fs.writeFileSync(outFile, JSON.stringify(content, null, 2) + '\n', 'utf8');

const counts = {
  categories: content.categories.length,
  featured: content.featured.length,
  services: content.services.length,
  experience: content.experience.length,
  portfolio: content.portfolio.length,
  portfolioFilters: content.portfolioFilters.length,
  why: content.why.length,
  process: content.process.length,
  testimonials: content.testimonials.length,
  faqs: content.faqs.length,
  heroTags: content.hero.tags.length,
  storyStats: content.story.stats.length,
  storyParagraphs: content.story.paragraphs.length,
  footerColumns: content.footer.columns.length,
  navLinks: content.header.navLinks.length,
  social: content.social.length,
};

console.log('Wrote ' + path.relative(ROOT, outFile));
for (const k of Object.keys(counts)) {
  console.log('  ' + k.padEnd(18) + counts[k]);
}
