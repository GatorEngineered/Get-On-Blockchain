# Image Optimization Guide

## Critical Performance Issue: Oversized Images

Your site currently has **3 critically oversized images** that are severely impacting performance:

| File | Current Size | Target Size | Reduction Needed |
|------|--------------|-------------|------------------|
| `getonblockchain-favicon.png` | **1.47 MB** | 50-100 KB | **~93% reduction** |
| `getonblockchain-logo.png` | **1.33 MB** | 200-300 KB | **~77% reduction** |
| `social-card.png` | **2.02 MB** | 400-500 KB | **~75% reduction** |

**Total Impact**: These 3 images add **~4.82 MB** of unnecessary load to your site.

---

## Why This Matters

### Performance Impact:
- **Slower Initial Page Load**: 4.82 MB extra download time
- **Poor Core Web Vitals**:
  - LCP (Largest Contentful Paint) - slower page rendering
  - CLS (Cumulative Layout Shift) - potential layout shifts
  - FID (First Input Delay) - delayed interactivity
- **Higher CDN/Bandwidth Costs**: Serving massive files repeatedly
- **Poor Mobile Experience**: Mobile users on slow connections will suffer
- **SEO Penalty**: Google penalizes slow sites in search rankings

### Where These Images Are Used:
- **favicon.png**: Header logo, footer logo, metadata icons
- **logo.png**: Schema.org structured data only
- **social-card.png**: Open Graph (Facebook/Twitter) preview images

---

## How to Optimize These Images

### Option 1: Online Tools (Easiest)

**For PNG files (favicon, logo):**
1. Use [TinyPNG](https://tinypng.com/)
   - Upload the images
   - Download compressed versions
   - Typically achieves 60-80% size reduction with no visible quality loss

**For social-card.png:**
1. Convert to WebP format using [Squoosh](https://squoosh.app/)
   - Upload social-card.png
   - Choose WebP format
   - Set quality to 85-90
   - Download as `social-card.webp`
2. Keep PNG as fallback, but compress with TinyPNG

### Option 2: Command Line Tools (Recommended for Developers)

**Install tools:**
```bash
npm install -g sharp-cli
```

**Optimize favicon (target: ~80 KB):**
```bash
npx sharp-cli resize 512 512 --input public/getonblockchain-favicon.png --output public/getonblockchain-favicon-optimized.png --quality 90
```

**Optimize logo (target: ~250 KB):**
```bash
npx sharp-cli resize 1200 1200 --input public/getonblockchain-logo.png --output public/getonblockchain-logo-optimized.png --quality 85
```

**Optimize social card (target: ~400 KB):**
```bash
npx sharp-cli resize 1200 630 --input public/social-card.png --format webp --output public/social-card.webp --quality 85
```

### Option 3: Design Software

**Using Photoshop:**
1. Open the image
2. File → Export → Save for Web (Legacy)
3. Choose PNG-8 or PNG-24
4. Enable "Reduce File Size" option
5. Adjust quality slider to ~80-85%
6. Export

**Using GIMP (Free):**
1. Open the image
2. Image → Scale Image (reduce dimensions if needed)
3. File → Export As
4. Choose PNG format
5. Adjust compression level to 6-8
6. Export

---

## Step-by-Step Implementation

### Step 1: Backup Original Files
```bash
mkdir public/originals
cp public/getonblockchain-favicon.png public/originals/
cp public/getonblockchain-logo.png public/originals/
cp public/social-card.png public/originals/
```

### Step 2: Optimize Images
Use one of the methods above to create optimized versions.

### Step 3: Replace Files
```bash
# Replace with optimized versions
mv public/getonblockchain-favicon-optimized.png public/getonblockchain-favicon.png
mv public/getonblockchain-logo-optimized.png public/getonblockchain-logo.png
mv public/social-card-optimized.webp public/social-card.webp
```

### Step 4: Update Metadata (if using WebP for social card)
In `src/app/layout.tsx`, update the Open Graph images:

```typescript
openGraph: {
  // ...
  images: [
    {
      url: "/social-card.webp",  // Changed from .png to .webp
      width: 1200,
      height: 630,
      alt: "Get On Blockchain loyalty rewards dashboard showing customer analytics",
    },
  ],
},
twitter: {
  // ...
  images: ["/social-card.webp"],  // Changed from .png to .webp
},
```

### Step 5: Test
1. Clear your browser cache
2. Visit your site
3. Open DevTools → Network tab
4. Verify image sizes are now <500 KB each

---

## Recommended Image Sizes

### Favicon (`getonblockchain-favicon.png`)
- **Dimensions**: 512×512 px (max)
- **Format**: PNG-24 with transparency
- **Target Size**: 50-100 KB
- **Usage**: Displayed at 16×16, 32×32, 36×36 in browser tabs/headers

### Logo (`getonblockchain-logo.png`)
- **Dimensions**: 1200×1200 px (max)
- **Format**: PNG-24 or SVG (preferred)
- **Target Size**: 200-300 KB (or <10 KB for SVG)
- **Usage**: Schema.org structured data

### Social Card (`social-card.png/webp`)
- **Dimensions**: 1200×630 px (exact)
- **Format**: WebP (primary), PNG (fallback)
- **Target Size**: 400-500 KB
- **Usage**: Facebook/Twitter/LinkedIn link previews

---

## Additional Recommendations

### 1. Convert Logo to SVG (Best Practice)
If your logo is vector-based, convert it to SVG:
- **Benefit**: 5-10 KB file size instead of 1.33 MB
- **Scalability**: Perfect quality at any size
- **How**: Use Adobe Illustrator, Inkscape, or an online converter

Update references:
```typescript
// In layout.tsx
logo: "https://getonblockchain.com/getonblockchain-logo.svg",
```

```tsx
// In AppShell.tsx and Footer.tsx
<Image
  src="/getonblockchain-logo.svg"
  alt="Get On Blockchain logo"
  width={36}
  height={36}
  priority
/>
```

### 2. Use Multiple Formats
Provide WebP with PNG fallback for maximum compatibility:

```tsx
<picture>
  <source srcSet="/getonblockchain-logo.webp" type="image/webp" />
  <source srcSet="/getonblockchain-logo.png" type="image/png" />
  <img src="/getonblockchain-logo.png" alt="Logo" />
</picture>
```

### 3. Enable Next.js Image Optimization
Already configured in `next.config.ts`:
- ✅ WebP and AVIF formats enabled
- ✅ Multiple device sizes for responsive images
- ✅ Compression enabled

---

## Expected Results After Optimization

### Before:
- Total image weight: **4.82 MB**
- Initial page load: **~6 seconds** (on 3G)
- Lighthouse Performance Score: **~50-60**

### After:
- Total image weight: **~750 KB** (85% reduction)
- Initial page load: **~2 seconds** (on 3G)
- Lighthouse Performance Score: **~85-95**

### Core Web Vitals Improvement:
- **LCP**: Improved by 2-3 seconds
- **FCP**: Improved by 1-2 seconds
- **Total Blocking Time**: Reduced by 50%

---

## Verification Checklist

After optimization, verify:

- [ ] `getonblockchain-favicon.png` is < 100 KB
- [ ] `getonblockchain-logo.png` is < 300 KB (or SVG < 10 KB)
- [ ] `social-card.png` or `social-card.webp` is < 500 KB
- [ ] Images still look sharp on retina displays
- [ ] Header logo loads instantly
- [ ] Social sharing previews work correctly
- [ ] Lighthouse Performance Score improved by 20+ points

---

## Resources

- [TinyPNG](https://tinypng.com/) - PNG compression
- [Squoosh](https://squoosh.app/) - Image format conversion
- [Sharp](https://sharp.pixelplumbing.com/) - Node.js image processing
- [WebPageTest](https://www.webpagetest.org/) - Performance testing
- [PageSpeed Insights](https://pagespeed.web.dev/) - Google's performance tool

---

## Need Help?

If you're unable to optimize the images yourself, you can:
1. Hire a developer on Fiverr ($5-20 task)
2. Use automated tools like Cloudinary or imgix
3. Contact your designer to provide optimized assets

**Priority**: This is a **critical** performance issue that should be fixed **immediately**. The 4.82 MB of images are the #1 performance bottleneck on your site.
