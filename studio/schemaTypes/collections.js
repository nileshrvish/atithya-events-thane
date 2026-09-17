/**
 * Collection documents — add, remove and reorder these freely.
 *
 * Every type has an `order` number. The site sorts on it, so to move an item
 * up the page, give it a lower number.
 */

const image = (description) => ({
  name: 'image',
  title: 'Photo',
  type: 'image',
  description,
  options: {hotspot: true},
  fields: [
    {
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: 'Describe the photo for screen readers.',
      validation: (Rule) => Rule.required().warning('Every image needs alt text.'),
    },
  ],
})

const order = {
  name: 'order',
  title: 'Order',
  type: 'number',
  description: 'Lower numbers appear first.',
  validation: (Rule) => Rule.required(),
}

const num = {
  name: 'num',
  title: 'Displayed number',
  type: 'string',
  description: 'The "01", "02" shown beside the item. Leave blank to number automatically.',
}

export const eventCategory = {
  name: 'eventCategory',
  title: 'Event Category',
  type: 'document',
  fields: [
    order,
    num,
    {name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required()},
    {name: 'desc', title: 'Description', type: 'text', rows: 2},
    image('Shown in the list and in the large image panel beside it.'),
  ],
  orderings: [{title: 'Order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'name', subtitle: 'desc', media: 'image'}},
}

export const featuredEvent = {
  name: 'featuredEvent',
  title: 'Featured Event',
  type: 'document',
  fields: [
    order,
    {name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required()},
    {
      name: 'meta',
      title: 'Meta tags',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Small labels above the title, e.g. Wedding / Alibaug / 2025.',
    },
    {name: 'body', title: 'Description', type: 'text', rows: 4},
    {name: 'linkLabel', title: 'Link label', type: 'string', initialValue: 'Plan something similar'},
    {name: 'linkHref', title: 'Link target', type: 'string', initialValue: '#enquiry'},
    {
      name: 'flip',
      title: 'Photo on the right',
      type: 'boolean',
      description: 'Alternate this between entries so the layout zig-zags.',
      initialValue: false,
    },
    image(),
  ],
  orderings: [{title: 'Order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'body', media: 'image'}},
}

export const service = {
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    order,
    num,
    {name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required()},
    {name: 'body', title: 'Description', type: 'text', rows: 3},
  ],
  orderings: [{title: 'Order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'body'}},
}

export const experienceStep = {
  name: 'experienceStep',
  title: 'Experience Step',
  type: 'document',
  description: 'The dark "signature experience" timeline.',
  fields: [
    order,
    {name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required()},
    {name: 'body', title: 'Description', type: 'text', rows: 3},
  ],
  orderings: [{title: 'Order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'body'}},
}

export const portfolioItem = {
  name: 'portfolioItem',
  title: 'Portfolio Item',
  type: 'document',
  fields: [
    order,
    {name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required()},
    {
      name: 'subtitle',
      title: 'Caption',
      type: 'string',
      description: 'e.g. "Wedding · Khandala".',
    },
    {
      name: 'category',
      title: 'Filter category',
      type: 'string',
      description: 'Must match one of the Portfolio Filter values exactly.',
      validation: (Rule) => Rule.required(),
    },
    image(),
    {
      name: 'width',
      title: 'Image width',
      type: 'number',
      initialValue: 800,
      description: 'Together with height this sets the tile shape. 800×600 is a landscape tile, 800×1067 a tall one.',
    },
    {name: 'height', title: 'Image height', type: 'number', initialValue: 600},
  ],
  orderings: [{title: 'Order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'subtitle', media: 'image'}},
}

export const portfolioFilter = {
  name: 'portfolioFilter',
  title: 'Portfolio Filter',
  type: 'document',
  description: 'The filter buttons above the portfolio grid.',
  fields: [
    order,
    {name: 'label', title: 'Button label', type: 'string', validation: (Rule) => Rule.required()},
    {
      name: 'value',
      title: 'Category value',
      type: 'string',
      description: 'Use "all" for the first button. Otherwise must match a Portfolio Item category.',
      validation: (Rule) => Rule.required(),
    },
  ],
  orderings: [{title: 'Order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'label', subtitle: 'value'}},
}

export const whyPoint = {
  name: 'whyPoint',
  title: 'Why Choose Us Point',
  type: 'document',
  fields: [
    order,
    num,
    {name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required()},
    {name: 'body', title: 'Description', type: 'text', rows: 2},
  ],
  orderings: [{title: 'Order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'body'}},
}

export const processStep = {
  name: 'processStep',
  title: 'How It Works Step',
  type: 'document',
  fields: [
    order,
    num,
    {name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required()},
    {name: 'body', title: 'Description', type: 'text', rows: 3},
  ],
  orderings: [{title: 'Order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'body'}},
}

export const testimonial = {
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    order,
    {name: 'quote', title: 'Quote', type: 'text', rows: 4, validation: (Rule) => Rule.required()},
    {name: 'name', title: 'Client name', type: 'string', validation: (Rule) => Rule.required()},
    {name: 'event', title: 'Event & place', type: 'string', description: 'e.g. "Wedding · Alibaug".'},
  ],
  orderings: [{title: 'Order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'name', subtitle: 'event'}},
}

export const faq = {
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  fields: [
    order,
    {name: 'question', title: 'Question', type: 'string', validation: (Rule) => Rule.required()},
    {name: 'answer', title: 'Answer', type: 'text', rows: 5, validation: (Rule) => Rule.required()},
  ],
  orderings: [{title: 'Order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'question', subtitle: 'answer'}},
}
