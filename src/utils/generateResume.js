/**
 * Generates and downloads a 1-page A4 PDF resume from profile.json data.
 *
 * Layout:
 *   - Dark navy header  : name, title (green live dot), contact, circular profile photo
 *   - Two-column body   : left  = about / certifications (badge images) / skills
 *                         right = experience / education
 *   - Dark navy footer  : site name
 *
 * Color palette mirrors the site's CSS variables:
 *   NAVY       #001c38   --ifm-color-primary-darkest
 *   DARK_BLUE  #003366   --ifm-color-primary-darker
 *   BLUE       #6699cc   --ifm-color-primary
 *   LIGHT_BLUE #99ccff   --ifm-color-primary-light
 *   GREEN      #39d353   terminal accent
 */

import profileData from '@site/src/data/profile.json';

// ── Palette ───────────────────────────────────────────────────────────
const NAVY       = [0,   28,  56 ];
const DARK_BLUE  = [0,   51,  102];
const BLUE       = [102, 153, 204];
const LIGHT_BLUE = [153, 204, 255];
const GREEN      = [57,  211, 83 ];
const WHITE      = [255, 255, 255];
const BODY_TEXT  = [15,  30,  50 ];
const MID_TEXT   = [70,  100, 140];

// ── Typography ────────────────────────────────────────────────────────
const PT_TO_MM          = 0.352778;
const LINE_HEIGHT_FACTOR = 1.15;

/** Line height in mm for a given font size in pt. */
function lh(sizePt) {
  return sizePt * PT_TO_MM * LINE_HEIGHT_FACTOR;
}

// ── Localisation ──────────────────────────────────────────────────────

/** Returns the _es variant of obj[key] when locale is 'es', falls back to obj[key]. */
function loc(locale, obj, key) {
  const esKey = `${key}_es`;
  return locale === 'es' && obj[esKey] ? obj[esKey] : obj[key];
}

const LABELS = {
  en: {
    about: 'ABOUT',
    certifications: 'CERTIFICATIONS',
    skills: 'SKILLS',
    experience: 'EXPERIENCE',
    projects: 'PERSONAL PROJECTS',
    education: 'EDUCATION',
    project1Title: 'Free Oracle Cloud Kubernetes cluster & Personal website hosting and CI/CD',
    project1Desc:
      'Personal portfolio site (Docusaurus/React) containerized and deployed on an always-free Oracle Cloud Kubernetes cluster. ' +
      'Infrastructure provisioned with Terraform, CI/CD via GitHub Actions, GitOps deployment through ArgoCD and Helm.',
    project1Link: 'Read about it here: ricardllop.com/docs/site-infrastructure',
    project1Url: 'https://ricardllop.com/docs/site-infrastructure',
    project2Title: 'Docker Compose Homelab',
    project2Desc:
      'Self-hosted homelab on a mini PC managed with Docker Compose. Services include Immich (photo library), ' +
      'Jellyfin (media server), AdGuard Home (DNS & ad blocking), and Caddy as a reverse proxy with automatic TLS.',
    project2Link: 'Read about it here: ricardllop.com/blog/homelab',
    project2Url: 'https://ricardllop.com/blog/homelab',
  },
  es: {
    about: 'SOBRE MÍ',
    certifications: 'CERTIFICACIONES',
    skills: 'HABILIDADES',
    experience: 'EXPERIENCIA',
    projects: 'PROYECTOS PERSONALES',
    education: 'EDUCACIÓN',
    project1Title: 'Clúster Kubernetes gratuito en Oracle Cloud & CI/CD para web personal',
    project1Desc:
      'Sitio personal (Docusaurus/React) contenedorizado y desplegado en un clúster Kubernetes siempre gratuito de Oracle Cloud. ' +
      'Infraestructura aprovisionada con Terraform, CI/CD mediante GitHub Actions, despliegue GitOps con ArgoCD y Helm.',
    project1Link: 'Leer más: ricardllop.com/es/docs/site-infrastructure',
    project1Url: 'https://ricardllop.com/es/docs/site-infrastructure',
    project2Title: 'Homelab con Docker Compose',
    project2Desc:
      'Homelab autoalojado en un mini PC gestionado con Docker Compose. Servicios: Immich (biblioteca de fotos), ' +
      'Jellyfin (servidor multimedia), AdGuard Home (DNS y bloqueo de anuncios), y Caddy como proxy inverso con TLS automático.',
    project2Link: 'Leer más: ricardllop.com/es/blog/homelab',
    project2Url: 'https://ricardllop.com/es/blog/homelab',
  },
};

// ── Image loading ─────────────────────────────────────────────────────

/**
 * Loads an image from a path relative to the site origin and returns a data URL.
 * Falls back to null on any load error so the PDF can still be generated.
 */
function loadImage(src) {
  const url = src.startsWith('http')
    ? src
    : `${window.location.origin}/${src}`;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth  || 200;
      canvas.height = img.naturalHeight || 200;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Loads an image, clips it to a circle using a canvas, and returns a data URL.
 * The `canvasSize` controls resolution (pixels); larger = sharper in the PDF.
 */
function loadCircularImage(src, canvasSize = 300) {
  const url = src.startsWith('http')
    ? src
    : `${window.location.origin}/${src}`;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = canvasSize;
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// ── Drawing helpers ───────────────────────────────────────────────────

/**
 * Draws a bold blue section label with a hairline underline rule.
 * Returns the y position of the first content line below it.
 */
function drawSectionLabel(doc, label, x, y, width) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...BLUE);
  doc.text(label, x, y);

  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.25);
  doc.line(x, y + 1.3, x + width, y + 1.3);

  return y + lh(8) + 1.5;
}

/**
 * Draws auto-wrapped text and returns the y position after the last line.
 * `gapAfter` adds extra padding below the block.
 */
function drawText(doc, text, x, y, width, sizePt, color, style = 'normal', gapAfter = 0) {
  doc.setFont('helvetica', style);
  doc.setFontSize(sizePt);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(text, width);
  doc.text(lines, x, y);
  return y + lines.length * lh(sizePt) + gapAfter;
}

// ── PDF generation ────────────────────────────────────────────────────

/**
 * Builds and triggers a download of the one-page PDF resume.
 * jsPDF is imported dynamically — safe for Docusaurus SSR.
 * Pass locale='es' to generate the Spanish version.
 */
const yearsExp   = new Date().getFullYear() - profileData.careerStartYear;
const resolveText = (text) => text.replace('{yearsExp}', yearsExp);

export async function downloadResume(locale = 'en') {
  const { jsPDF } = await import('jspdf');
  const L = LABELS[locale] || LABELS.en;

  // Load all images in parallel before drawing anything
  const [profileImgData, ...badgeImgData] = await Promise.all([
    loadCircularImage(profileData.profileImage.src, 300),
    ...profileData.badges.map(b => loadImage(b.image)),
  ]);

  const doc    = new jsPDF({ unit: 'mm', format: 'a4' });
  const PAGE_W = 210;
  const MARGIN = 13;

  // ── HEADER ────────────────────────────────────────────────────────
  const HEADER_H = 44;
  const PHOTO_D  = 32;   // profile photo diameter in mm
  const PHOTO_X  = PAGE_W - MARGIN - PHOTO_D;
  const PHOTO_Y  = (HEADER_H - PHOTO_D) / 2;

  // Navy background + left accent strip
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, HEADER_H, 'F');
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, 3.5, HEADER_H, 'F');

  // Circular profile photo + blue ring border
  if (profileImgData) {
    doc.addImage(profileImgData, 'PNG', PHOTO_X, PHOTO_Y, PHOTO_D, PHOTO_D);
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.7);
    doc.circle(PHOTO_X + PHOTO_D / 2, PHOTO_Y + PHOTO_D / 2, PHOTO_D / 2, 'S');
  }

  // Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...WHITE);
  doc.text(
    `${profileData.name.toUpperCase()} ${profileData.lastName.toUpperCase()}`,
    MARGIN, 17
  );

  // Green status dot + role title
  doc.setFillColor(...GREEN);
  doc.circle(MARGIN, 25.5, 1.4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...LIGHT_BLUE);
  doc.text(profileData.title, MARGIN + 5, 26);

  // Separator (stops before the photo)
  doc.setDrawColor(...DARK_BLUE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, 32, profileImgData ? PHOTO_X - 4 : PAGE_W - MARGIN, 32);

  // Contact info
  const { email, linkedin, github, website } = profileData.contact;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(180, 210, 245);
  doc.text(`${email}   |   ${linkedin}   |   ${github}   |   ${website}`, MARGIN, 38);

  // ── COLUMN SETUP ──────────────────────────────────────────────────
  const BODY_TOP  = HEADER_H + 7;
  const LEFT_X    = MARGIN;
  const LEFT_W    = 58;
  const DIVIDER_X = LEFT_X + LEFT_W + 5;
  const RIGHT_X   = DIVIDER_X + 5;
  const RIGHT_W   = PAGE_W - RIGHT_X - MARGIN;

  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.2);
  doc.line(DIVIDER_X, BODY_TOP, DIVIDER_X, 282);

  // ── LEFT COLUMN : About / Certifications / Skills ────────────────
  let ly = BODY_TOP;

  // About
  ly = drawSectionLabel(doc, L.about, LEFT_X, ly, LEFT_W);
  for (const paragraph of loc(locale, profileData, 'description')) {
    ly = drawText(doc, resolveText(paragraph), LEFT_X, ly, LEFT_W, 8, BODY_TEXT, 'normal', 2.5);
  }

  ly += 4;

  // Certifications — badge image on the left, name text on the right
  ly = drawSectionLabel(doc, L.certifications, LEFT_X, ly, LEFT_W);

  const BADGE_SIZE  = 13;   // image size in mm (square)
  const BADGE_GAP   = 3;    // gap between image and text
  const BADGE_TEXT_X = LEFT_X + BADGE_SIZE + BADGE_GAP;
  const BADGE_TEXT_W = LEFT_W - BADGE_SIZE - BADGE_GAP;

  for (let i = 0; i < profileData.badges.length; i++) {
    if (badgeImgData[i]) {
      doc.addImage(badgeImgData[i], 'PNG', LEFT_X, ly, BADGE_SIZE, BADGE_SIZE);
    }

    // Vertically center the name within the badge image height
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const nameLines  = doc.splitTextToSize(profileData.badges[i].name, BADGE_TEXT_W);
    const textHeight = nameLines.length * lh(8);
    const textBaseY  = ly + (BADGE_SIZE - textHeight) / 2 + lh(8) * 0.75;
    doc.setTextColor(...BODY_TEXT);
    doc.text(nameLines, BADGE_TEXT_X, textBaseY);

    ly += BADGE_SIZE + 2;
  }

  ly += 4;

  // Skills
  ly = drawSectionLabel(doc, L.skills, LEFT_X, ly, LEFT_W);
  drawText(doc, profileData.skills.join('  /  '), LEFT_X, ly, LEFT_W, 8, MID_TEXT);

  // ── RIGHT COLUMN : Experience / Education ────────────────────────
  let ry = BODY_TOP;

  // Experience
  ry = drawSectionLabel(doc, L.experience, RIGHT_X, ry, RIGHT_W);

  for (const exp of profileData.experiences.filter(e => e.type === 'work')) {
    const expTitle = loc(locale, exp, 'title');
    const expDate  = loc(locale, exp, 'date');
    const expDesc  = loc(locale, exp, 'description');

    // Job title (left) + date (right) on the same baseline
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BODY_TEXT);
    doc.text(expTitle, RIGHT_X, ry);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MID_TEXT);
    doc.text(expDate, RIGHT_X + RIGHT_W, ry, { align: 'right' });

    ry += lh(9);

    // Company name
    ry = drawText(doc, exp.subtitle, RIGHT_X, ry, RIGHT_W, 8.5, BLUE, 'bold', 1.5);

    // Description lines (lines starting with "-" are indented as bullets;
    // lines matching "- Label: ..." get the label drawn bold)
    if (expDesc) {
      doc.setFontSize(7.5);
      doc.setTextColor(...BODY_TEXT);
      for (const line of expDesc) {
        const isBullet  = line.startsWith('-');
        const indentX   = isBullet ? RIGHT_X + 2 : RIGHT_X;
        const width     = isBullet ? RIGHT_W - 2  : RIGHT_W;
        const boldMatch = line.match(/^(- [^:]+:)(.*)$/);

        if (boldMatch) {
          // Draw bold "- Label:" prefix, then wrap the rest on the same line
          const label  = boldMatch[1];
          const rest   = boldMatch[2];
          doc.setFont('helvetica', 'bold');
          doc.text(label, indentX, ry);
          const labelW = doc.getTextWidth(label);

          doc.setFont('helvetica', 'normal');
          const restLines = doc.splitTextToSize(rest, width - labelW);
          doc.text(restLines[0], indentX + labelW, ry);
          for (let r = 1; r < restLines.length; r++) {
            ry += lh(7.5);
            doc.text(restLines[r], indentX, ry);
          }
          ry += lh(7.5);
        } else {
          doc.setFont('helvetica', 'normal');
          const wrapped = doc.splitTextToSize(line, width);
          doc.text(wrapped, indentX, ry);
          ry += wrapped.length * lh(7.5);
        }
      }
    }

    ry += 4;
  }

  // Personal Projects
  ry = drawSectionLabel(doc, L.projects, RIGHT_X, ry, RIGHT_W);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BODY_TEXT);
  doc.text(L.project1Title, RIGHT_X, ry);
  ry += lh(9);

  ry = drawText(doc, L.project1Desc, RIGHT_X, ry, RIGHT_W, 7.5, BODY_TEXT, 'normal', 1.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...BLUE);
  doc.textWithLink(L.project1Link, RIGHT_X, ry, { url: L.project1Url });
  ry += lh(7.5) + 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BODY_TEXT);
  doc.text(L.project2Title, RIGHT_X, ry);
  ry += lh(9);

  ry = drawText(doc, L.project2Desc, RIGHT_X, ry, RIGHT_W, 7.5, BODY_TEXT, 'normal', 1.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...BLUE);
  doc.textWithLink(L.project2Link, RIGHT_X, ry, { url: L.project2Url });
  ry += lh(7.5) + 4;

  // Education
  ry = drawSectionLabel(doc, L.education, RIGHT_X, ry, RIGHT_W);

  for (const exp of profileData.experiences.filter(e => e.type === 'education')) {
    const expTitle = loc(locale, exp, 'title');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BODY_TEXT);
    doc.text(expTitle, RIGHT_X, ry);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MID_TEXT);
    doc.text(exp.date, RIGHT_X + RIGHT_W, ry, { align: 'right' });

    ry += lh(9);

    ry = drawText(doc, exp.subtitle, RIGHT_X, ry, RIGHT_W, 8, BLUE, 'italic', 3);
  }

  // ── FOOTER ────────────────────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 285, PAGE_W, 12, 'F');
  doc.setFillColor(...BLUE);
  doc.rect(0, 285, 3.5, 12, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 210, 245);
  doc.text('ricardllop.com', MARGIN, 292);

  doc.save('ricard-llop-resume.pdf');
}
