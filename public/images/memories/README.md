# Daeil Band memory archive

Add post-show photos here as optimized WebP files.

Recommended:
- Maximum long edge: 1600px (1200px is fine for smaller downloads)
- WebP quality: 82–88
- Use unique filenames with English letters, numbers, and hyphens
- Keep original full-resolution photos in a separate backup

After adding each image, also register its public path and optional caption in the `memoryPhotos` array near the top of `app/page.js`.

Example:

```js
const memoryPhotos = [
  {
    src: "/images/memories/2026-11-21-stage-01.webp",
    caption: "대일밴드 첫 무대",
  },
];
```

Commit and push both the image file(s) and `app/page.js` to `main`. Vercel deploys automatically. This gallery uses static repository files and does not depend on Supabase.

The repository and website are public. Anyone can view and download these image files. Get consent from people pictured before publishing.
