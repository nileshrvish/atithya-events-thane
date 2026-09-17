# Images

This folder is for your own photography.

Right now every image on the site is a hosted Unsplash / Pexels URL, so the
site works with nothing in here. To switch to your own pictures:

1. Drop the file in this folder, e.g. `assets/images/hero.jpg`.
2. Find the matching `<img>` in `index.html` and replace **both** `src` and
   `srcset` with your path. Delete `srcset` and `sizes` if you only have one
   size of the image.

```html
<!-- before -->
<img src="https://images.unsplash.com/photo-xxxx?w=1600" srcset="..." sizes="..." alt="...">

<!-- after -->
<img src="assets/images/hero.jpg" alt="A candlelit reception table at dusk">
```

## Guidelines

| Use            | Suggested width | Format          |
| -------------- | --------------- | --------------- |
| Hero / banner  | 2000–2400 px    | `.webp`, `.jpg` |
| Portfolio card | 1200–1600 px    | `.webp`, `.jpg` |
| Thumbnail      | 600–800 px      | `.webp`, `.jpg` |

- Compress before committing (Squoosh, TinyPNG). Aim under ~300 KB each.
- Always write a real `alt` description — it is read aloud by screen readers
  and shown if the image fails to load.
- Keep filenames lowercase with hyphens: `wedding-mandap-evening.jpg`.
