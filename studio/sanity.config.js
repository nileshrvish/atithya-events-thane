/**
 * ATITHYA EVENTS THANE — Sanity Studio
 *
 * Run locally:   npm run dev      (http://localhost:3333)
 * Deploy:        npm run deploy   (gives you a hosted studio URL)
 */
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes, SINGLETONS} from './schemaTypes/index.js'

// Atithya Events Thane — Sanity project.
// Env vars win, so a second dataset (e.g. "staging") needs no code change.
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'dzj440zw'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

/** Sidebar: singletons as single entries, collections as lists. */
const structure = (S) =>
  S.list()
    .title('Website')
    .items([
      S.listItem().title('Brand, Header & Contact').id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.listItem().title('SEO & Sharing').id('seoSettings')
        .child(S.document().schemaType('seoSettings').documentId('seoSettings')),
      S.listItem().title('Home Page Copy').id('homePage')
        .child(S.document().schemaType('homePage').documentId('homePage')),
      S.divider(),
      S.documentTypeListItem('eventCategory').title('Event Categories'),
      S.documentTypeListItem('featuredEvent').title('Featured Events'),
      S.documentTypeListItem('service').title('Services'),
      S.documentTypeListItem('experienceStep').title('Experience Steps'),
      S.divider(),
      S.documentTypeListItem('portfolioItem').title('Portfolio'),
      S.documentTypeListItem('portfolioFilter').title('Portfolio Filters'),
      S.divider(),
      S.documentTypeListItem('whyPoint').title('Why Choose Us'),
      S.documentTypeListItem('processStep').title('How It Works'),
      S.documentTypeListItem('testimonial').title('Testimonials'),
      S.documentTypeListItem('faq').title('FAQs'),
    ])

export default defineConfig({
  name: 'atithya',
  title: 'Atithya Events Thane',
  projectId,
  dataset,
  plugins: [structureTool({structure}), visionTool()],
  schema: {
    types: schemaTypes,
    // Hide "create new" for singletons.
    templates: (prev) => prev.filter((t) => !SINGLETONS.includes(t.schemaType)),
  },
  document: {
    actions: (prev, {schemaType}) =>
      SINGLETONS.includes(schemaType)
        ? prev.filter(({action}) => !['unpublish', 'delete', 'duplicate'].includes(action))
        : prev,
  },
})
