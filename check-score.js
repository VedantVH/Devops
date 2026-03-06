#!/usr/bin/env node
/**
 * check-score.js
 * ──────────────
 * Performance Gate Script — Phase 2 of perf-gated-cicd
 *
 * Reads a Lighthouse JSON report and exits with code 1
 * if the performance score falls below PERF_THRESHOLD.
 *
 * Usage:
 *   node check-score.js [path-to-report.json]
 *
 * Env vars:
 *   PERF_THRESHOLD  — minimum score (default: 80)
 *   REPORT_PATH     — path to Lighthouse JSON (default: lh-report.json)
 */

const fs   = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────
const THRESHOLD   = parseInt(process.env.PERF_THRESHOLD || '80', 10);
const REPORT_PATH = process.argv[2]
  || process.env.REPORT_PATH
  || 'lh-report.json';

// ── Read Report ─────────────────────────────────────────────
if (!fs.existsSync(REPORT_PATH)) {
  console.error(`❌ Report not found: ${REPORT_PATH}`);
  console.error('   Run Lighthouse first and output to JSON.');
  process.exit(1);
}

let report;
try {
  report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
} catch (e) {
  console.error(`❌ Failed to parse report: ${e.message}`);
  process.exit(1);
}

// ── Extract Scores ──────────────────────────────────────────
const cats = report.categories;
const perf         = Math.round((cats.performance?.score      ?? 0) * 100);
const accessibility= Math.round((cats.accessibility?.score    ?? 0) * 100);
const bestPractices= Math.round((cats['best-practices']?.score?? 0) * 100);
const seo          = Math.round((cats.seo?.score              ?? 0) * 100);

// Key metrics
const lcp  = report.audits?.['largest-contentful-paint']?.displayValue  ?? 'N/A';
const fid  = report.audits?.['total-blocking-time']?.displayValue        ?? 'N/A';
const cls  = report.audits?.['cumulative-layout-shift']?.displayValue    ?? 'N/A';
const ttfb = report.audits?.['server-response-time']?.displayValue       ?? 'N/A';

// ── Pretty Output ───────────────────────────────────────────
const line = '─'.repeat(44);
const pad  = (label, val, pass) =>
  `  ${label.padEnd(22)} ${String(val).padStart(6)}   ${pass ? '✅' : '❌'}`;

console.log(`\n╔${line}╗`);
console.log(`║  🔦 LIGHTHOUSE PERFORMANCE GATE              ║`);
console.log(`╚${line}╝`);
console.log(`\n  Threshold: ${THRESHOLD}/100\n`);
console.log(`  ── Category Scores ────────────────────────`);
console.log(pad('Performance',    perf,          perf          >= THRESHOLD));
console.log(pad('Accessibility',  accessibility, accessibility >= 70));
console.log(pad('Best Practices', bestPractices, bestPractices >= 70));
console.log(pad('SEO',            seo,           seo           >= 70));
console.log(`\n  ── Core Web Vitals ─────────────────────────`);
console.log(`  LCP  (Largest Contentful Paint)   ${lcp}`);
console.log(`  TBT  (Total Blocking Time)         ${fid}`);
console.log(`  CLS  (Cumulative Layout Shift)     ${cls}`);
console.log(`  TTFB (Server Response Time)        ${ttfb}`);
console.log(`\n${line.padStart(46)}`);

// ── The Gate ────────────────────────────────────────────────
if (perf < THRESHOLD) {
  console.error(`\n  🚨 GATE FAILED`);
  console.error(`     Score ${perf} is below threshold ${THRESHOLD}`);
  console.error(`     Deployment BLOCKED.\n`);

  // Write summary for GitHub Actions
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      `## 🚨 Performance Gate: FAILED\n` +
      `| Metric | Value |\n|---|---|\n` +
      `| Score | **${perf}/100** |\n` +
      `| Threshold | ${THRESHOLD} |\n` +
      `| LCP | ${lcp} |\n` +
      `| TBT | ${fid} |\n` +
      `| CLS | ${cls} |\n` +
      `\n> ❌ Deployment was **blocked**. Fix performance issues and push again.\n`
    );
  }

  process.exit(1); // Non-zero exit = pipeline fails
}

console.log(`\n  ✅ GATE PASSED`);
console.log(`     Score ${perf} meets threshold ${THRESHOLD}`);
console.log(`     Proceeding to deployment.\n`);

// Write success summary for GitHub Actions
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    `## ✅ Performance Gate: PASSED\n` +
    `| Metric | Value |\n|---|---|\n` +
    `| Score | **${perf}/100** |\n` +
    `| Threshold | ${THRESHOLD} |\n` +
    `| LCP | ${lcp} |\n` +
    `| TBT | ${fid} |\n` +
    `| CLS | ${cls} |\n` +
    `\n> ✅ Deployment **approved**.\n`
  );
}
