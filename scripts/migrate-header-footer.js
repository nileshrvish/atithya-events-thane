/**
 * ATITHYA EVENTS THANE — additive migration: header & footer chrome
 *
 * Adds the navigation / social / footer-chrome fields to the siteSettings and
 * homePage documents that were imported before those fields existed.
 *
 *   npm run migrate
 *
 * SAFE TO RUN ON LIVE CONTENT. It uses setIfMissing, so it only fills fields
 * that are currently empty — it never overwrites anything you have edited in
 * the Studio, and it touches no other document type. Re-running it does
 * nothing once the fields are populated.
 *
 * Pass --force to overwrite these specific fields back to the original values.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');
require('./load-env')();

const FORCE = process.argv.includes('--force');
const projectId = process.env.SANITY_PROJECT_ID;
const token = process.env.SANITY_TOKEN;

if (!projectId || !token) {
  console.error('Missing SANITY_PROJECT_ID / SANITY_TOKEN. Set them in .env.');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: process.env.SANITY_API_VERSION || '2024-01-01',
  token,
  useCdn: false,
});

const content = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'content/fallback.json'), 'utf8')
);

async function main() {
  const dataset = process.env.SANITY_DATASET || 'production';
  console.log('Migrating ' + projectId + '/' + dataset +
              (FORCE ? '  (--force: overwriting these fields)' : '  (additive only)') + '\n');

  const siteFields = {
    navLinks: content.header.navLinks.map((l, i) => ({ _key: 'nav' + i, ...l })),
    navCta: content.header.cta,
    drawerWhatsappLabel: content.header.drawerWhatsappLabel,
    socials: content.social.map((x, i) => ({
      _key: 'soc' + i,
      platform: x.platform,
      ...(x.url ? { url: x.url } : {}),
    })),
  };

  const footerFields = {
    'footer.contactHeading': content.footer.contactHeading,
    'footer.ctaLabel': content.footer.ctaLabel,
  };

  // Footer columns already existed in the schema but were never rendered, so
  // some datasets have them and some do not. setIfMissing covers both.
  const footerColumns = {
    'footer.columns': content.footer.columns
      .filter((c) => c.links.length)
      .map((c, i) => ({
        _key: 'col' + i,
        heading: c.heading,
        links: c.links.map((l, j) => ({ _key: 'l' + i + j, ...l })),
      })),
  };

  const apply = (patch, fields) => (FORCE ? patch.set(fields) : patch.setIfMissing(fields));

  await apply(client.patch('siteSettings'), siteFields).commit();
  console.log('  siteSettings  navLinks (' + siteFields.navLinks.length + '), navCta, ' +
              'drawerWhatsappLabel, socials (' + siteFields.socials.length + ')');

  await apply(client.patch('homePage'), Object.assign({}, footerFields, footerColumns)).commit();
  console.log('  homePage      footer.contactHeading, footer.ctaLabel, footer.columns');

  // Report what is actually stored now, so the result is verifiable.
  const check = await client.fetch(
    `{"s": *[_id == "siteSettings"][0]{navLinks, navCta, drawerWhatsappLabel, socials},
      "h": *[_id == "homePage"][0]{"f": footer{contactHeading, ctaLabel, "cols": count(columns)}}}`
  );
  console.log('\nNow in Sanity:');
  console.log('  navLinks            ' + (check.s.navLinks || []).length);
  console.log('  navCta.label        ' + JSON.stringify((check.s.navCta || {}).label));
  console.log('  drawerWhatsappLabel ' + JSON.stringify(check.s.drawerWhatsappLabel));
  console.log('  socials             ' + (check.s.socials || []).map((x) => x.platform).join(', '));
  console.log('  footer.columns      ' + check.h.f.cols);
  console.log('  footer.contactHeading ' + JSON.stringify(check.h.f.contactHeading));
  console.log('  footer.ctaLabel     ' + JSON.stringify(check.h.f.ctaLabel));
  console.log('\nDone. Now run: npm run build');
}

main().catch((err) => {
  console.error('\nMigration failed: ' + err.message);
  process.exit(1);
});
