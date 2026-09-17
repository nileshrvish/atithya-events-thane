import {siteSettings, seoSettings, homePage} from './singletons.js'
import {
  eventCategory, featuredEvent, service, experienceStep,
  portfolioItem, portfolioFilter, whyPoint, processStep,
  testimonial, faq,
} from './collections.js'

export const schemaTypes = [
  // Singletons
  siteSettings, seoSettings, homePage,
  // Collections
  eventCategory, featuredEvent, service, experienceStep,
  portfolioItem, portfolioFilter, whyPoint, processStep,
  testimonial, faq,
]

/** Document types that should only ever have one instance. */
export const SINGLETONS = ['siteSettings', 'seoSettings', 'homePage']
