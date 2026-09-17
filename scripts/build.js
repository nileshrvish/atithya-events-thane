/**
 * ATITHYA EVENTS THANE — static site build
 *
 * Renders src/index.template.html with content from Sanity (or, when Sanity is
 * not configured, from content/fallback.json) and writes the finished static
 * site to dist/.
 *
 *   npm run build
 *
 * Environment variables (all optional — without them the build uses the local
 * fallback content, which is exactly what the site shipped with):
 *
 *   SANITY_PROJECT_ID   your Sanity project id        e.g. "a1b2c3d4"
 *   SANITY_DATASET      dataset name                  default "production"
 *   SANITY_API_VERSION  API date                      default "2024-01-01"
 *   SANITY_TOKEN        read token — only needed for a private dataset
 */
'use strict';

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
require('./load-env')();  // read .env, if present

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

/* ------------------------------------------------------------------ helpers */

Handlebars.registerHelper('add', (a, b) => Number(a) + Number(b));
Handlebars.registerHelper('pad', (n) => String(n).padStart(2, '0'));

/** "240+" → "240<span aria-hidden="true">+</span>" so the + stays decorative. */
Handlebars.registerHelper('statValue', (v) => {
  const s = String(v == null ? '' : v);
  const m = s.match(/^(.*?)([+]| *\+)$/);
  const esc = Handlebars.Utils.escapeExpression;
  return new Handlebars.SafeString(
    m ? esc(m[1]) + '<span aria-hidden="true">+</span>' : esc(s)
  );
});

/* Inline SVGs for the footer social icons, keyed by platform. Kept in code
   rather than in the CMS so editors never paste raw markup into a field. */
const SOCIAL_ICONS = {
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1Z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.7-1.8C19.3 5 12 5 12 5s-7.3 0-8.9.5A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.7 1.8C4.7 19 12 19 12 19s7.3 0 8.9-.5a2.5 2.5 0 0 0 1.7-1.8C23 15.2 23 12 23 12ZM9.8 15.1V8.9l6 3.1-6 3.1Z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.9 8.4H3.6V21h3.3V8.4ZM5.2 3a1.9 1.9 0 1 0 0 3.9 1.9 1.9 0 0 0 0-3.9ZM20.4 21h-3.3v-6.1c0-1.5-.5-2.5-1.8-2.5-1 0-1.6.7-1.9 1.3-.1.2-.1.6-.1.9V21H10s.1-11.4 0-12.6h3.3V10c.4-.7 1.2-1.7 3-1.7 2.2 0 3.9 1.4 3.9 4.5V21Z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 3h3.1l-6.8 7.8L21.8 21h-6.2l-4.9-6.4L5.1 21H2l7.3-8.3L2.3 3h6.4l4.4 5.8L17.5 3Zm-1.1 16.1h1.7L7.7 4.8H5.9l10.5 14.3Z"/></svg>',
  pinterest: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5.1s-.3-.6-.3-1.5c0-1.4.8-2.5 1.9-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.2-.9 3.5-.2 1 .5 1.9 1.6 1.9 1.9 0 3.3-2 3.3-4.9 0-2.6-1.8-4.4-4.4-4.4-3 0-4.8 2.2-4.8 4.6 0 .9.3 1.9.8 2.4.1.1.1.2.1.3l-.3 1.1c0 .2-.1.2-.3.1-1.3-.6-2.1-2.5-2.1-4 0-3.3 2.4-6.3 6.9-6.3 3.6 0 6.4 2.6 6.4 6 0 3.6-2.2 6.5-5.4 6.5-1.1 0-2-.6-2.4-1.2l-.6 2.4c-.2.9-.8 2-1.2 2.6A10 10 0 1 0 12 2Z"/></svg>',
};

const SOCIAL_NAMES = {
  instagram: 'Instagram', whatsapp: 'WhatsApp', facebook: 'Facebook',
  youtube: 'YouTube', linkedin: 'LinkedIn', x: 'X', pinterest: 'Pinterest',
};

Handlebars.registerHelper('socialIcon', (platform) =>
  new Handlebars.SafeString(SOCIAL_ICONS[platform] || ''));
Handlebars.registerHelper('socialName', (platform) =>
  SOCIAL_NAMES[platform] || platform);
Handlebars.registerHelper('eq', (a, b) => a === b);

/** "+91 91371 72872" → "+919137172872" for a tel: href. */
Handlebars.registerHelper('telHref', (phone, whatsapp) => {
  const digits = String(phone || '').replace(/[^0-9+]/g, '');
  return digits || '+' + String(whatsapp || '').replace(/\D/g, '');
});

function log(msg) { process.stdout.write(msg + '\n'); }

/* ----------------------------------------------------------- content source */

async function loadFromSanity(projectId) {
  const { createClient } = require('@sanity/client');
  const imageUrlBuilder = require('@sanity/image-url');

  const client = createClient({
    projectId,
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: process.env.SANITY_API_VERSION || '2024-01-01',
    token: process.env.SANITY_TOKEN || undefined,
    useCdn: !process.env.SANITY_TOKEN,
  });
  const builder = imageUrlBuilder(client);

  /** Turn a Sanity image into the {src, srcset, alt, width, height} the template wants. */
  function img(source, width, height, widths) {
    if (!source || !source.asset) return null;
    const base = builder.image(source).auto('format').fit('crop').quality(80);
    const out = {
      src: base.width(width).height(height).url(),
      alt: source.alt || '',
      width,
      height,
    };
    if (widths && widths.length) {
      const ratio = height / width;
      out.srcset = widths
        .map((w) => base.width(w).height(Math.round(w * ratio)).url() + ' ' + w + 'w')
        .join(', ');
    }
    if (source.sizes) out.sizes = source.sizes;
    return out;
  }

  const QUERY = `{
    "settings":     *[_type == "siteSettings"][0],
    "seo":          *[_type == "seoSettings"][0],
    "home":         *[_type == "homePage"][0],
    "categories":   *[_type == "eventCategory"]   | order(order asc),
    "featured":     *[_type == "featuredEvent"]   | order(order asc),
    "services":     *[_type == "service"]         | order(order asc),
    "experience":   *[_type == "experienceStep"]  | order(order asc),
    "portfolio":    *[_type == "portfolioItem"]   | order(order asc),
    "filters":      *[_type == "portfolioFilter"] | order(order asc),
    "why":          *[_type == "whyPoint"]        | order(order asc),
    "process":      *[_type == "processStep"]     | order(order asc),
    "testimonials": *[_type == "testimonial"]     | order(order asc),
    "faqs":         *[_type == "faq"]             | order(order asc)
  }`;

  const d = await client.fetch(QUERY);
  if (!d.settings) {
    throw new Error(
      'Sanity returned no siteSettings document. Has the content been imported?\n' +
      '  Run: npm run import'
    );
  }

  const num = (i) => String(i + 1).padStart(2, '0');
  const home = d.home || {};

  // Header/footer chrome is structural: an empty nav or a blank button is a
  // broken page, not a stylistic choice. Catch it here rather than shipping it.
  const missing = [];
  if (!(d.settings.navLinks || []).length) missing.push('siteSettings.navLinks');
  if (!(d.settings.navCta && d.settings.navCta.label)) missing.push('siteSettings.navCta');
  if (!(d.settings.socials || []).length) missing.push('siteSettings.socials');
  if (!((home.footer || {}).columns || []).length) missing.push('homePage.footer.columns');
  if (!(home.footer || {}).contactHeading) missing.push('homePage.footer.contactHeading');
  if (missing.length) {
    throw new Error(
      'Sanity is missing header/footer fields:\n    ' + missing.join('\n    ') +
      '\n\n  These were added to the schema after your content was imported.' +
      '\n  Seed them without touching your other edits:\n    npm run migrate'
    );
  }

  return {
    site: {
      brandMark: d.settings.brandMark,
      brandSub: d.settings.brandSub,
      brandFull: d.settings.brandFull,
      whatsappNumber: d.settings.whatsappNumber,
      phone: d.settings.phone,
      email: d.settings.email,
      city: d.settings.city,
      instagram: d.settings.instagram,
      directMessage: d.settings.directMessage,
    },
    header: {
      logo: img(d.settings.logo, 240, 68, [240, 480]),
      navLinks: d.settings.navLinks || [],
      cta: d.settings.navCta || {},
      drawerCtaLabel: (d.settings.navCta && d.settings.navCta.label) || '',
      drawerWhatsappLabel: d.settings.drawerWhatsappLabel || '',
    },
    social: (d.settings.socials || []).map((x) => ({
      platform: x.platform,
      // Instagram falls back to the Instagram URL field; WhatsApp needs none.
      url: x.url || (x.platform === 'instagram' ? d.settings.instagram : ''),
    })),
    seo: d.seo
      ? {
          title: d.seo.title,
          description: d.seo.description,
          canonical: d.seo.canonical,
          themeColor: d.seo.themeColor || '#FBF8F3',
          ogSiteName: d.seo.ogSiteName,
          ogTitle: d.seo.ogTitle,
          ogDescription: d.seo.ogDescription,
          ogImage: d.seo.ogImage ? img(d.seo.ogImage, 1200, 630).src : '',
          ogImageAlt: (d.seo.ogImage && d.seo.ogImage.alt) || '',
        }
      : {},
    hero: {
      image: img(home.heroImage, 2400, 1600, [1200, 1800, 2400]),
      eyebrow: home.heroEyebrow,
      headlineLines: home.heroHeadlineLines || [],
      copy: home.heroCopy,
      buttons: home.heroButtons || [],
      tags: home.heroTags || [],
    },
    categories: (d.categories || []).map((c, i) => ({
      num: c.num || num(i),
      name: c.name,
      desc: c.desc,
      image: img(c.image, 760, 950),
    })),
    story: {
      heading: home.storyHeading,
      paragraphs: home.storyParagraphs || [],
      signature: home.storySignature,
      stats: home.storyStats || [],
      images: [img(home.storyImage1, 900, 1125, [700, 1100]), img(home.storyImage2, 600, 600)],
    },
    featured: (d.featured || []).map((f) => ({
      flip: !!f.flip,
      image: img(f.image, 1100, 756, [800, 1400]),
      meta: f.meta || [],
      title: f.title,
      body: f.body,
      linkHref: f.linkHref || '#enquiry',
      linkLabel: f.linkLabel || 'Plan something similar',
    })),
    services: (d.services || []).map((x, i) => ({ num: x.num || num(i), title: x.title, body: x.body })),
    experience: (d.experience || []).map((x) => ({ title: x.title, body: x.body })),
    portfolio: (d.portfolio || []).map((p) => ({
      category: p.category,
      image: img(p.image, p.width || 800, p.height || 600),
      title: p.title,
      subtitle: p.subtitle,
    })),
    portfolioFilters: (d.filters || []).map((f) => ({ value: f.value, label: f.label })),
    why: (d.why || []).map((x, i) => ({ num: x.num || num(i), title: x.title, body: x.body })),
    process: (d.process || []).map((x, i) => ({ num: x.num || num(i), title: x.title, body: x.body })),
    testimonials: (d.testimonials || []).map((t) => ({ quote: t.quote, name: t.name, event: t.event })),
    faqs: (d.faqs || []).map((f) => ({ question: f.question, answer: f.answer })),
    cta: {
      image: img(home.ctaImage, 1400, 933, [900, 1800]),
      eyebrow: home.ctaEyebrow,
      heading: home.ctaHeading,
      body: home.ctaBody,
    },
    footer: Object.assign({}, home.footer, {
      logo: img(d.settings.footerLogo, 300, 90, [300, 600]),
    }),
  };
}

function loadFallback() {
  const p = path.join(ROOT, 'content/fallback.json');
  if (!fs.existsSync(p)) {
    throw new Error('content/fallback.json is missing. Run: npm run extract');
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/* ------------------------------------------------------------------- output */

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, entry.name);
    const b = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

/** site.config.js is generated too, so contact details stay CMS-driven. */
function writeSiteConfig(site) {
  const j = (v) => JSON.stringify(v == null ? '' : v);
  return `/*!
 * ATITHYA EVENTS THANE
 * Site configuration — GENERATED AT BUILD TIME. Do not edit by hand.
 * Source: Sanity (siteSettings) or content/fallback.json.
 */
window.SITE = {
  whatsappNumber : ${j(site.whatsappNumber)},
  phone          : ${j(site.phone)},
  email          : ${j(site.email)},
  city           : ${j(site.city)},
  instagram      : ${j(site.instagram)},
  directMessage  : ${j(site.directMessage)}
};
`;
}

/* --------------------------------------------------------------------- main */

async function main() {
  const projectId = process.env.SANITY_PROJECT_ID;
  let content;
  let source;

  if (projectId) {
    log('Content source: Sanity (project ' + projectId + ')');
    content = await loadFromSanity(projectId);
    source = 'sanity';
  } else {
    log('Content source: content/fallback.json  (set SANITY_PROJECT_ID to use Sanity)');
    content = loadFallback();
    source = 'fallback';
  }

  // Values the template needs that are derived rather than authored.
  content.firstCategoryName = content.categories.length ? content.categories[0].name : '';
  content.footerBlurb = String(content.footer.blurb || '').replace(
    '{{CITY}}',
    '<span data-site="city">' + Handlebars.Utils.escapeExpression(content.site.city) + '</span>'
  );

  const templatePath = path.join(ROOT, 'src/index.template.html');
  const template = Handlebars.compile(fs.readFileSync(templatePath, 'utf8'), { noEscape: false });
  const html = template(content);

  // Fail loudly rather than shipping a half-rendered page.
  const leftovers = html.match(/\{\{[^}]*\}\}/g);
  if (leftovers) {
    throw new Error('Unrendered template tags in output: ' + [...new Set(leftovers)].join(', '));
  }

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  copyDir(path.join(ROOT, 'assets'), path.join(DIST, 'assets'));
  fs.writeFileSync(path.join(DIST, 'index.html'), html, 'utf8');
  fs.writeFileSync(path.join(DIST, 'assets/js/site.config.js'), writeSiteConfig(content.site), 'utf8');

  const counts = ['categories', 'featured', 'services', 'experience', 'portfolio',
                  'why', 'process', 'testimonials', 'faqs']
    .map((k) => k + '=' + (content[k] || []).length).join('  ');

  log('');
  log('  dist/index.html        ' + (html.length / 1024).toFixed(1) + ' KB');
  log('  dist/assets/           copied');
  log('  ' + counts);
  log('');
  log('Built from ' + source + '.');
}

main().catch((err) => {
  console.error('\nBuild failed: ' + err.message);
  process.exit(1);
});
