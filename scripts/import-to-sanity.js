/**
 * ATITHYA EVENTS THANE — seed Sanity from the site's existing content
 *
 * Reads content/fallback.json, uploads every photo to Sanity's asset store and
 * creates one document per piece of content. After this runs, the Studio is
 * populated with exactly what the site shows today — nothing to retype.
 *
 *   SANITY_PROJECT_ID=xxxx SANITY_TOKEN=yyyy npm run import
 *
 * The token must have WRITE access (Sanity → Project → API → Tokens → Editor).
 * Safe to re-run: documents use fixed ids, so a second run overwrites rather
 * than duplicates. Pass --skip-images to reuse already-uploaded photos.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');
require('./load-env')();  // read .env, if present

const ROOT = path.join(__dirname, '..');
const SKIP_IMAGES = process.argv.includes('--skip-images');

const projectId = process.env.SANITY_PROJECT_ID;
const token = process.env.SANITY_TOKEN;

if (!projectId || !token) {
  console.error(
    'Missing credentials.\n\n' +
    '  SANITY_PROJECT_ID   your project id (Sanity dashboard → Project settings)\n' +
    '  SANITY_TOKEN        an Editor token (Project → API → Tokens → Add token)\n\n' +
    'Example (PowerShell):\n' +
    '  $env:SANITY_PROJECT_ID="abc12345"; $env:SANITY_TOKEN="sk..."; npm run import\n'
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: process.env.SANITY_API_VERSION || '2024-01-01',
  token,
  useCdn: false,
});

const content = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/fallback.json'), 'utf8'));

/* ------------------------------------------------------------------ images */

const uploaded = new Map();
let uploadCount = 0;

/** Download a remote photo once and upload it to Sanity; returns an image field. */
async function upload(image, label) {
  if (!image || !image.src) return undefined;
  if (SKIP_IMAGES) return undefined;

  const key = image.src;
  if (!uploaded.has(key)) {
    process.stdout.write('  uploading ' + label + ' … ');
    const res = await fetch(image.src);
    if (!res.ok) throw new Error('could not download ' + image.src + ' (' + res.status + ')');
    const buf = Buffer.from(await res.arrayBuffer());
    const asset = await client.assets.upload('image', buf, {
      filename: label.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.jpg',
    });
    uploaded.set(key, asset._id);
    uploadCount++;
    process.stdout.write('ok\n');
  }
  return {
    _type: 'image',
    asset: { _type: 'reference', _ref: uploaded.get(key) },
    alt: image.alt || '',
  };
}

/* --------------------------------------------------------------- documents */

async function main() {
  console.log('Importing into project ' + projectId + ' (dataset ' +
              (process.env.SANITY_DATASET || 'production') + ')\n');

  const docs = [];

  /* singletons -------------------------------------------------------- */
  docs.push({
    _id: 'siteSettings',
    _type: 'siteSettings',
    ...content.site,
    navLinks: content.header.navLinks.map((l, i) => ({ _key: 'nav' + i, ...l })),
    navCta: content.header.cta,
    drawerWhatsappLabel: content.header.drawerWhatsappLabel,
    socials: content.social.map((x, i) => ({ _key: 'soc' + i, platform: x.platform, url: x.url || undefined })),
    // logo / footerLogo are left empty — the site uses the text wordmark until
    // someone uploads one in the Studio.
  });

  docs.push({
    _id: 'seoSettings',
    _type: 'seoSettings',
    title: content.seo.title,
    description: content.seo.description,
    canonical: content.seo.canonical,
    themeColor: content.seo.themeColor,
    ogSiteName: content.seo.ogSiteName,
    ogTitle: content.seo.ogTitle,
    ogDescription: content.seo.ogDescription,
    ogImage: await upload({ src: content.seo.ogImage, alt: content.seo.ogImageAlt }, 'og-image'),
  });

  docs.push({
    _id: 'homePage',
    _type: 'homePage',
    heroImage: await upload(content.hero.image, 'hero'),
    heroEyebrow: content.hero.eyebrow,
    heroHeadlineLines: content.hero.headlineLines,
    heroCopy: content.hero.copy,
    heroButtons: content.hero.buttons.map((b, i) => ({ _key: 'btn' + i, ...b })),
    heroTags: content.hero.tags,
    storyImage1: await upload(content.story.images[0], 'story-1'),
    storyImage2: await upload(content.story.images[1], 'story-2'),
    storyHeading: content.story.heading,
    storyParagraphs: content.story.paragraphs,
    storySignature: content.story.signature,
    storyStats: content.story.stats.map((s, i) => ({ _key: 'stat' + i, ...s })),
    ctaImage: await upload(content.cta.image, 'cta'),
    ctaEyebrow: content.cta.eyebrow,
    ctaHeading: content.cta.heading,
    ctaBody: content.cta.body,
    footer: {
      word: content.footer.word,
      blurb: content.footer.blurb,
      legal: content.footer.legal,
      credit: content.footer.credit,
      contactHeading: content.footer.contactHeading,
      ctaLabel: content.footer.ctaLabel,
      columns: content.footer.columns
        .filter((c) => c.links.length)
        .map((c, i) => ({
          _key: 'col' + i,
          heading: c.heading,
          links: c.links.map((l, j) => ({ _key: 'l' + i + j, ...l })),
        })),
    },
  });

  /* collections ------------------------------------------------------- */
  const collection = async (list, type, map) => {
    for (let i = 0; i < list.length; i++) {
      docs.push({
        _id: type + '-' + (i + 1),
        _type: type,
        order: (i + 1) * 10,
        ...(await map(list[i], i)),
      });
    }
  };

  await collection(content.categories, 'eventCategory', async (c, i) => ({
    num: c.num, name: c.name, desc: c.desc,
    image: await upload(c.image, 'category-' + (i + 1) + '-' + c.name),
  }));

  await collection(content.featured, 'featuredEvent', async (f, i) => ({
    title: f.title, meta: f.meta, body: f.body,
    linkLabel: f.linkLabel, linkHref: f.linkHref, flip: f.flip,
    image: await upload(f.image, 'featured-' + (i + 1)),
  }));

  await collection(content.services, 'service', async (s) => ({
    num: s.num, title: s.title, body: s.body,
  }));

  await collection(content.experience, 'experienceStep', async (s) => ({
    title: s.title, body: s.body,
  }));

  await collection(content.portfolio, 'portfolioItem', async (p, i) => ({
    title: p.title, subtitle: p.subtitle, category: p.category,
    width: p.image.width, height: p.image.height,
    image: await upload(p.image, 'portfolio-' + (i + 1)),
  }));

  await collection(content.portfolioFilters, 'portfolioFilter', async (f) => ({
    label: f.label, value: f.value,
  }));

  await collection(content.why, 'whyPoint', async (w) => ({
    num: w.num, title: w.title, body: w.body,
  }));

  await collection(content.process, 'processStep', async (p) => ({
    num: p.num, title: p.title, body: p.body,
  }));

  await collection(content.testimonials, 'testimonial', async (t) => ({
    quote: t.quote, name: t.name, event: t.event,
  }));

  await collection(content.faqs, 'faq', async (f) => ({
    question: f.question, answer: f.answer,
  }));

  /* write ------------------------------------------------------------- */
  console.log('\n  ' + uploadCount + ' photos uploaded');
  console.log('  creating ' + docs.length + ' documents …');

  let tx = client.transaction();
  for (const doc of docs) tx = tx.createOrReplace(doc);
  await tx.commit();

  const byType = docs.reduce((a, d) => ((a[d._type] = (a[d._type] || 0) + 1), a), {});
  console.log('');
  for (const t of Object.keys(byType).sort()) {
    console.log('    ' + t.padEnd(18) + byType[t]);
  }
  console.log('\nDone. Open the Studio (npm run studio) to edit, then rebuild:');
  console.log('  SANITY_PROJECT_ID=' + projectId + ' npm run build');
}

main().catch((err) => {
  console.error('\nImport failed: ' + err.message);
  process.exit(1);
});
