# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio/CV website for a DevOps/Cloud Engineer, built with **Docusaurus 3.6.3** (React-based static site generator). Deployed as a Docker container on an ARM64 Kubernetes cluster on Oracle Cloud, managed via GitOps with ArgoCD.

## Commands

```bash
npm start          # Start dev server with hot reload (localhost:3000)
npm run build      # Build static site for production
npm run serve      # Serve production build locally
npm run clear      # Clear Docusaurus build cache
npm run swizzle    # Customize Docusaurus theme components
```

No test suite is configured.

## Architecture

### Content Structure
- `src/pages/index.js` — Homepage: hero section, badges, "Download Resume" button, terminal-style infra card, and vertical work timeline (all inline, no separate component file)
- `src/data/profile.json` — Single source of truth for all profile data: name, title, careerStartYear, contact, skills, badges, description paragraphs, profileImage, learnMoreLink, and experiences array
- `src/utils/generateResume.js` — Generates and downloads a 1-page A4 PDF resume from `profile.json` using jsPDF (dynamically imported for SSR safety). Mirrors the site's color palette.
- `src/css/custom.css` — Theme overrides (Infima CSS variables, dark mode, badge/profile image sizing)
- `docs/site-infrastructure.md` — Infrastructure documentation (Kubernetes, Terraform, ArgoCD, CI/CD)
- `blog/` — Portfolio project posts
- `blog/authors.yml` — Author definitions required when creating new blog posts (add entries here first)

### Key rendering patterns in `index.js`
- `{yearsExp}` placeholder in `profile.json` description strings is resolved at runtime via `resolveText()`
- Experience `description` array supports two line formats rendered by `renderDescBlock()`:
  - `"- Label: item1, item2"` → labeled tech-stack pills (`DescStack`)
  - Plain text → prose paragraph
- `src/pages/index.module.css` — Component-level styles for the homepage (hero, timeline, terminal card, etc.)

### i18n (English / Spanish)
The site is bilingual. Two separate systems handle translations:

1. **`profile.json` dynamic content** — append `_es` to any field to provide a Spanish override (e.g., `title_es`, `date_es`, `description_es`). The `loc(locale, obj, key)` helper in `index.js` picks the right variant at render time.
2. **Static UI strings in `index.js`** — defined in the `UI` object (`UI.en` / `UI.es`) at the top of the file.
3. **Blog posts and docs** — Spanish versions live under `i18n/es/docusaurus-plugin-content-blog/` and `i18n/es/docusaurus-plugin-content-docs/` mirroring the same filenames.
4. **Navbar/footer** — translated in `i18n/es/docusaurus-theme-classic/navbar.json` and `footer.json`.

### Dependencies
- `react-vertical-timeline-component` — vertical timeline in the Experience section
- `jspdf` — PDF resume generation (dynamic import, client-side only)

### Configuration
- `docusaurus.config.js` — Site config with navbar, footer, and theme. Respects `DOCKER_IMAGE_TAG` and `DOCUSAURUS_CONF_URL` env vars
- `sidebars.js` — Auto-generates sidebar from `docs/` directory

### CI/CD & Deployment
The GitHub Actions workflow (`.github/workflows/build-deploy-docker.yml`) triggers on push to `main`:
1. Builds a multi-stage Docker image for `linux/arm64` (Nginx serving static files)
2. Tags the image with timestamp format `ga-YYYY.MM.DD-HHMM` and pushes to Docker Hub (`rllopdev/dgsite`)
3. Checks out a separate Helm repo (`ricardllop/oke-helm-charts`) and updates the image tag in `values.yaml` using `yq`
4. ArgoCD detects the Helm repo change and auto-syncs the deployment

**Dockerfile** targets production ARM64. **Dockerfile-local** is for local container testing with different URL defaults:
```bash
docker build -f Dockerfile-local -t dgsite:local .
docker run -p 80:80 dgsite:local
```

> **Note:** Deployment is available through both Docker/ArgoCD and the GitHub Pages workflow. GitHub Pages runs `npm run build` and publishes the generated `build/` directory; `npm run serve` can be used to preview that build locally.
