/**
 * Singleton documents — there is exactly one of each.
 * Contact details, SEO metadata, and the one-off copy on the home page.
 */

const img = (name, title, description) => ({
  name,
  title,
  type: 'image',
  description,
  options: {hotspot: true},
  fields: [
    {
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: 'Describe the photo for screen readers and for when the image fails to load.',
      validation: (Rule) => Rule.required().warning('Every image needs alt text.'),
    },
  ],
})

/** The social platforms the site has icons for. */
const SOCIAL_PLATFORMS = [
  {title: 'Instagram', value: 'instagram'},
  {title: 'WhatsApp', value: 'whatsapp'},
  {title: 'Facebook', value: 'facebook'},
  {title: 'YouTube', value: 'youtube'},
  {title: 'LinkedIn', value: 'linkedin'},
  {title: 'X (Twitter)', value: 'x'},
  {title: 'Pinterest', value: 'pinterest'},
]

/** A {label, href} pair, used for every navigation and footer link. */
const linkObject = {
  type: 'object',
  fields: [
    {name: 'label', title: 'Label', type: 'string', validation: (Rule) => Rule.required()},
    {
      name: 'href',
      title: 'Link',
      type: 'string',
      description: 'An anchor on this page (#events) or a full URL.',
      validation: (Rule) => Rule.required(),
    },
  ],
  preview: {select: {title: 'label', subtitle: 'href'}},
}

export const siteSettings = {
  name: 'siteSettings',
  title: 'Brand, Header & Contact',
  type: 'document',
  groups: [
    {name: 'brand', title: 'Brand & Logo', default: true},
    {name: 'header', title: 'Header & Menu'},
    {name: 'contact', title: 'Contact'},
    {name: 'social', title: 'Social'},
  ],
  fields: [
    {
      ...img(
        'logo',
        'Header logo (optional)',
        'Upload a logo to replace the text wordmark in the header. Leave empty to keep the "Atithya · EVENTS THANE" wordmark. Use a transparent PNG or SVG; it is scaled to 34px tall.',
      ),
      group: 'brand',
    },
    {
      ...img(
        'footerLogo',
        'Footer logo (optional)',
        'Replaces the large footer wordmark. Leave empty to keep the text. Shown on a dark background, so use a light/white logo.',
      ),
      group: 'brand',
    },
    {
      name: 'brandMark',
      title: 'Wordmark',
      type: 'string',
      description: 'The large part of the logo, e.g. "Atithya". Used when no logo image is uploaded.',
      group: 'brand',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'brandSub',
      title: 'Wordmark subtitle',
      type: 'string',
      description: 'The small caps part after the dot, e.g. "Events Thane".',
      group: 'brand',
    },
    {
      name: 'brandFull',
      title: 'Full business name',
      type: 'string',
      description: 'Used in accessibility labels and the footer copyright.',
      group: 'brand',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'whatsappNumber',
      title: 'WhatsApp number',
      type: 'string',
      description:
        'DIGITS ONLY — no +, spaces, hyphens or brackets. 91 is the India country code, then the 10-digit number. Every "Chat on WhatsApp" button and the enquiry form use this.',
      group: 'contact',
      validation: (Rule) =>
        Rule.required()
          .regex(/^[0-9]{8,15}$/, {name: 'digits only'})
          .error('Digits only — no +, spaces or hyphens.'),
    },
    {
      name: 'phone',
      title: 'Phone number (as displayed)',
      type: 'string',
      description: 'Formatted for humans, e.g. "+91 91371 72872".',
      group: 'contact',
    },
    {
      name: 'email',
      title: 'Email address',
      type: 'string',
      group: 'contact',
      validation: (Rule) => Rule.required().email(),
    },
    {
      name: 'city',
      title: 'City / service area',
      type: 'string',
      description: 'Appears in the hero, the story signature and the footer.',
      group: 'contact',
    },
    {
      name: 'instagram',
      title: 'Instagram URL',
      type: 'url',
      description: 'Used by the Instagram entry in Social links below.',
      group: 'social',
    },
    {
      name: 'directMessage',
      title: 'Default WhatsApp message',
      type: 'string',
      description: 'Pre-filled when someone taps a "Chat on WhatsApp" button.',
      group: 'contact',
    },

    /* ------------------------------------------------- header & menu */
    {
      name: 'navLinks',
      title: 'Navigation links',
      type: 'array',
      of: [linkObject],
      description:
        'Drives BOTH the desktop header menu and the mobile slide-out menu — they always stay in sync. The mobile menu numbers them automatically.',
      group: 'header',
      validation: (Rule) => Rule.min(1),
    },
    {
      name: 'navCta',
      title: 'Header button',
      type: 'object',
      description: 'The outlined button at the top right. Also used as the first button in the mobile menu.',
      group: 'header',
      fields: [
        {name: 'label', title: 'Button text', type: 'string'},
        {name: 'href', title: 'Button link', type: 'string'},
      ],
    },
    {
      name: 'drawerWhatsappLabel',
      title: 'Mobile menu WhatsApp button',
      type: 'string',
      description: 'Text on the WhatsApp button at the bottom of the mobile menu.',
      group: 'header',
    },

    /* ------------------------------------------------------- social */
    {
      name: 'socials',
      title: 'Social links',
      type: 'array',
      description:
        'Shown as icons in the footer, in this order. WhatsApp needs no URL — it uses the WhatsApp number above. Instagram uses the Instagram URL above if you leave its URL empty.',
      group: 'social',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'platform',
              title: 'Platform',
              type: 'string',
              options: {list: SOCIAL_PLATFORMS},
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'url',
              title: 'URL',
              type: 'url',
              description: 'Leave empty for WhatsApp, and for Instagram if set above.',
            },
          ],
          preview: {select: {title: 'platform', subtitle: 'url'}},
        },
      ],
    },
  ],
  preview: {prepare: () => ({title: 'Brand, Header & Contact'})},
}

export const seoSettings = {
  name: 'seoSettings',
  title: 'SEO & Sharing',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Browser tab title',
      type: 'string',
      description: 'Shown in search results. Aim for under 60 characters.',
      validation: (Rule) => Rule.required().max(70).warning('Long titles get truncated in Google.'),
    },
    {
      name: 'description',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      description: 'The grey text under your link in Google. Aim for 150–160 characters.',
      validation: (Rule) => Rule.max(200).warning('Over 160 characters may be truncated.'),
    },
    {
      name: 'canonical',
      title: 'Site URL',
      type: 'url',
      description: 'The live address of the site, e.g. https://atithyaevents.in/',
    },
    {name: 'themeColor', title: 'Browser theme colour', type: 'string', initialValue: '#FBF8F3'},
    {name: 'ogSiteName', title: 'Site name (sharing)', type: 'string'},
    {
      name: 'ogTitle',
      title: 'Share title',
      type: 'string',
      description: 'Headline shown when the link is shared on WhatsApp or Facebook.',
    },
    {name: 'ogDescription', title: 'Share description', type: 'text', rows: 2},
    img('ogImage', 'Share image', 'Shown in WhatsApp and social previews. Use a 1200×630 photo.'),
  ],
  preview: {prepare: () => ({title: 'SEO & Sharing'})},
}

export const homePage = {
  name: 'homePage',
  title: 'Home Page Copy',
  type: 'document',
  groups: [
    {name: 'hero', title: 'Hero'},
    {name: 'story', title: 'Our Story'},
    {name: 'cta', title: 'Closing CTA'},
    {name: 'footer', title: 'Footer'},
  ],
  fields: [
    /* -------------------------------------------------------------- hero */
    img('heroImage', 'Hero background photo', 'The full-width photo behind the headline.'),
    {name: 'heroEyebrow', title: 'Small label above headline', type: 'string', group: 'hero'},
    {
      name: 'heroHeadlineLines',
      title: 'Headline (one line per entry)',
      type: 'array',
      of: [{type: 'string'}],
      description:
        'Each entry animates in as its own line. Wrap a word in <em class="italic">…</em> to italicise it.',
      group: 'hero',
    },
    {name: 'heroCopy', title: 'Sub-headline', type: 'text', rows: 2, group: 'hero'},
    {
      name: 'heroButtons',
      title: 'Buttons',
      type: 'array',
      group: 'hero',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'label', title: 'Label', type: 'string'},
            {name: 'href', title: 'Link', type: 'string', description: 'e.g. #enquiry or #work'},
            {
              name: 'style',
              title: 'Style',
              type: 'string',
              options: {list: [{title: 'Solid', value: 'light'}, {title: 'Outline', value: 'onDark'}]},
            },
          ],
          preview: {select: {title: 'label', subtitle: 'href'}},
        },
      ],
    },
    {
      name: 'heroTags',
      title: 'Tags under the hero',
      type: 'array',
      of: [{type: 'string'}],
      group: 'hero',
    },

    /* ------------------------------------------------------------- story */
    img('storyImage1', 'Story photo (tall)'),
    img('storyImage2', 'Story photo (small inset)'),
    {
      name: 'storyHeading',
      title: 'Heading',
      type: 'string',
      description: 'Use <br> to force a line break.',
      group: 'story',
    },
    {
      name: 'storyParagraphs',
      title: 'Paragraphs',
      type: 'array',
      of: [{type: 'text', rows: 3}],
      description: 'The first paragraph is styled larger than the rest.',
      group: 'story',
    },
    {
      name: 'storySignature',
      title: 'Signature line',
      type: 'string',
      description: 'The city is added automatically after this.',
      group: 'story',
    },
    {
      name: 'storyStats',
      title: 'Statistics',
      type: 'array',
      group: 'story',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'value',
              title: 'Number',
              type: 'string',
              description: 'A trailing + is rendered as decoration, e.g. "240+".',
            },
            {name: 'label', title: 'Label', type: 'string'},
          ],
          preview: {select: {title: 'value', subtitle: 'label'}},
        },
      ],
    },

    /* --------------------------------------------------------------- cta */
    img('ctaImage', 'Closing section background photo'),
    {name: 'ctaEyebrow', title: 'Small label', type: 'string', group: 'cta'},
    {name: 'ctaHeading', title: 'Heading', type: 'string', group: 'cta'},
    {name: 'ctaBody', title: 'Body', type: 'text', rows: 2, group: 'cta'},

    /* ------------------------------------------------------------ footer */
    {
      name: 'footer',
      title: 'Footer',
      type: 'object',
      group: 'footer',
      fields: [
        {name: 'word', title: 'Footer wordmark', type: 'string'},
        {
          name: 'blurb',
          title: 'Footer blurb',
          type: 'text',
          rows: 3,
          description: 'Write {{CITY}} where the city name should appear.',
        },
        {
          name: 'columns',
          title: 'Link columns',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {name: 'heading', title: 'Column heading', type: 'string'},
                {
                  name: 'links',
                  title: 'Links',
                  type: 'array',
                  of: [
                    {
                      type: 'object',
                      fields: [
                        {name: 'label', title: 'Label', type: 'string'},
                        {name: 'href', title: 'Link', type: 'string'},
                      ],
                      preview: {select: {title: 'label', subtitle: 'href'}},
                    },
                  ],
                },
              ],
              preview: {select: {title: 'heading'}},
            },
          ],
        },
        {
          name: 'contactHeading',
          title: 'Contact column heading',
          type: 'string',
          description: 'Heading above the phone/email/city column, e.g. "Get in touch".',
        },
        {
          name: 'ctaLabel',
          title: 'WhatsApp button text',
          type: 'string',
          description: 'The button under the contact column. Leave empty to hide it.',
        },
        {name: 'legal', title: 'Copyright line', type: 'string'},
        {name: 'credit', title: 'Credit line', type: 'string'},
      ],
    },
  ],
  preview: {prepare: () => ({title: 'Home Page Copy'})},
}
