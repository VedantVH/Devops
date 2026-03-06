# Phase 2 — Performance Fixes

This document tracks every fix applied to get `index.html` from **40/100 → 94/100**.

## Before vs After

| Metric | Before (Broken) | After (Fixed) | Change |
|--------|----------------|---------------|--------|
| Lighthouse Score | 40 / 100 | 94 / 100 | **+54 pts** |
| LCP | 7.4s | ~1.0s | **−6.4s** |
| TBT | 1,730ms | ~0ms | **−1,730ms** |
| CLS | 0 | 0 | — |
| Gate Status | ❌ BLOCKED | ✅ DEPLOYED | |

---

## Fix #1 — Font Loading Strategy
**Problem:** Google Fonts loaded as render-blocking CSS. Browser had to fully download
the stylesheet before painting anything on screen.

**Fix:** Added `preconnect` hints + loaded fonts with `media="print"` trick so they
never block rendering. Falls back gracefully with `<noscript>`.

```html
<!-- BEFORE: render-blocking -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?...&display=swap"/>

<!-- AFTER: non-blocking -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?...&display=swap"
      media="print" onload="this.media='all'">
```

---

## Fix #2 — Remove Unused CSS
**Problem:** `animate.css` (80KB) was loaded synchronously but never used anywhere
on the page. Pure wasted bandwidth on every page load.

**Fix:** Deleted the `<link>` tag entirely.

---

## Fix #3 — Remove Main Thread Blocker
**Problem:** A 600ms `while` loop ran synchronously on page load, freezing the
browser's main thread. This inflated TBT (Total Blocking Time) by 600ms+ directly.

**Fix:** Deleted the loop. There was no legitimate reason for it.

```js
// BEFORE: 600ms freeze
const start = Date.now();
while (Date.now() - start < 600) { }

// AFTER: removed entirely
```

---

## Fix #4 — Remove Unused CDN Scripts
**Problem:** 4 large libraries were loaded as render-blocking scripts despite never
being used by the page — lodash (73KB), moment.js (67KB), Chart.js (200KB), three.js (600KB).
Total: ~1.2MB of blocking downloads.

**Fix:** Deleted all 4 script tags.

---

## Fix #5 — Remove Oversized Images
**Problem:** Two 3000×2000px images (~2MB each) were loaded on page load even though
they were visually hidden. The browser still had to download them, massively inflating LCP.

**Fix:** Removed the hidden image container entirely.

---

## Fix #6 — Remove Layout Thrashing
**Problem:** A loop of 200 iterations alternated `paddingTop` and read `offsetHeight`,
forcing the browser to recalculate layout 200 times in a row (layout thrashing).
This caused additional TBT and jank.

**Fix:** Removed the loop. Animation script now runs `defer`red after page load.

---

## Key Lesson

> The gate didn't just catch "slow code" — it forced us to understand **why** it was slow.
> Each fix maps directly to a Lighthouse audit category:
> - **LCP** → image size + font blocking
> - **TBT** → blocking scripts + main thread work
> - **FCP** → render-blocking resources

This is what "Performance as Code" means in practice.
