# 🚦 PerfGuard — Web Performance-Gated CI/CD Pipeline

![Performance Gate](https://img.shields.io/badge/Performance%20Gate-Active-red?style=flat-square&logo=lighthouse)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Powered-2088FF?style=flat-square&logo=github-actions)
![Lighthouse](https://img.shields.io/badge/Lighthouse-CLI-F44B21?style=flat-square&logo=lighthouse)

> **"Slow code never ships."** — A CI/CD pipeline that automatically blocks deployments when Lighthouse performance scores fall below a configurable threshold.

---

## 🎯 What This Project Does

Most CI/CD pipelines ask: *"Does it build? Does it deploy?"*

This pipeline asks: **"Is it fast enough to deploy?"**

Every push to `main` triggers an automated Lighthouse audit. If the performance score is below **80/100**, the deployment is **automatically blocked** — no human intervention needed.

```
Push Code → Build → 🔦 Lighthouse Audit → 🚦 Gate Check → 🚀 Deploy (or ❌ BLOCK)
```

---

## 📁 Project Structure

```
perf-gated-cicd/
├── index.html                        ← Demo web app (the subject of audits)
├── scores.json                       ← Score history (auto-updated by CI)
├── scripts/
│   └── check-score.js                ← The performance gate logic
├── .github/
│   └── workflows/
│       └── perf-gate.yml             ← GitHub Actions pipeline
└── README.md
```

---

## 🚀 Quickstart

### 1. Fork this repo
```bash
git clone https://github.com/YOUR_USERNAME/perf-gated-cicd
cd perf-gated-cicd
```

### 2. Enable GitHub Pages
- Go to **Settings → Pages**
- Source: **Deploy from a branch → `gh-pages`**

### 3. Push a commit to trigger the pipeline
```bash
git commit --allow-empty -m "trigger: test the gate"
git push origin main
```

### 4. Watch the pipeline
- Go to **Actions tab** in your repo
- Watch the `🚦 Performance Gate` workflow run
- Download the Lighthouse HTML report from the **Artifacts** section

---

## ⚙️ Configuration

### Change the performance threshold
Edit `.github/workflows/perf-gate.yml`:
```yaml
- name: 🚦 Performance Gate Check
  env:
    PERF_THRESHOLD: 90   # ← Change this (default: 80)
  run: node scripts/check-score.js lh-report.report.json
```

Or pass it as a repo secret/env var:
```bash
# In GitHub → Settings → Secrets → Actions
PERF_THRESHOLD=85
```

---

## 🔦 Running Lighthouse Locally

```bash
# Install Lighthouse globally
npm install -g lighthouse

# Audit your local dev server
npx serve . -p 3000 &
lighthouse http://localhost:3000 \
  --output=json,html \
  --output-path=./lh-report \
  --chrome-flags="--headless"

# Run the gate check manually
node scripts/check-score.js lh-report.report.json
```

---

## 🐢 Intentional Performance Issues (Phase 1 Demo)

`index.html` currently contains deliberate performance problems so you can watch the gate **fail**:

| Issue | Location | Impact |
|---|---|---|
| Render-blocking Google Fonts | `<head>` | Delays LCP |
| Unused CSS library (animate.css) | `<head>` | Wastes bandwidth |
| Synchronous JS blocking | `<body>` end | Increases TBT |

**To see the gate PASS**, fix these:
1. Add `font-display: swap` to font imports
2. Remove unused `animate.css`
3. Add `defer` or `async` to scripts

---

## 📊 Phase Roadmap

| Phase | Status | Description |
|---|---|---|
| **1** | ✅ **Current** | Demo app + project structure |
| **2** | 🔜 | Lighthouse CLI + `check-score.js` gate |
| **3** | 🔜 | Full GitHub Actions pipeline |
| **4** | 🔜 | Score history dashboard |
| **5** | 🔜 | Polish, docs & portfolio presentation |

---

## 🛠 Tech Stack

- **GitHub Actions** — CI/CD runner
- **Lighthouse CLI** — Performance auditing engine  
- **Node.js** — Gate script runtime
- **GitHub Pages** — Deployment target
- **HTML/CSS/JS** — Demo web app (no build step needed)

---

## 📖 Key Concepts

**Performance as Code** — treating performance budgets the same way you treat unit tests. They run automatically, they can fail builds, and they live in version control.

**The Gate Pattern** — a pipeline step that calls `process.exit(1)` on failure, which GitHub Actions interprets as a job failure, which blocks all downstream jobs (including `deploy`).

**Lighthouse JSON** — the audit output contains `categories.performance.score` as a 0–1 float. Multiply by 100 to get the familiar 0–100 score.

---

*Built as a portfolio project demonstrating Performance-as-Code and CI/CD best practices.*
