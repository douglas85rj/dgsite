import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';
import profileData from '@site/src/data/profile.json';
import { downloadResume } from '@site/src/utils/generateResume';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';

const yearsExp = new Date().getFullYear() - profileData.careerStartYear;
const resolveText = (text) => text.replace('{yearsExp}', yearsExp);

// Returns the _es variant of a field when locale is 'es', falls back to base field
const loc = (locale, obj, key) => {
  const esKey = `${key}_es`;
  return locale === 'es' && obj[esKey] ? obj[esKey] : obj[key];
};

const UI = {
  en: {
    greeting: (name) => `Hello, I am ${name}`,
    downloadResume: 'Download Resume',
    terminalCmd: 'Click to view the infrastructure and CICD behind this site',
    exploreArch: 'Explore the architecture',
    experience: 'Experience',
  },
  es: {
    greeting: (name) => `Hola, soy ${name}`,
    downloadResume: 'Descargar CV',
    terminalCmd: 'Ver la infraestructura y CI/CD detrás de este sitio',
    exploreArch: 'Explorar la arquitectura',
    experience: 'Experiencia',
  },
};

function HomepageHeader({ locale }) {
  const ui = UI[locale] || UI.en;
  const description = loc(locale, profileData, 'description');
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <div className="row">
          <div className={clsx('col', styles.heroContent)}>
            <div className="descriptiontext">
              <h2 className={styles.nameHeading}>{ui.greeting(profileData.name)}</h2>
              <h1 className={styles.roleTitle}>{profileData.title}</h1>
              {description.map((paragraph, index) => (
                <p key={index} className={index < description.length - 1 ? 'pmid' : ''}>
                  {resolveText(paragraph)}
                </p>
              ))}
            </div>
            <div className={styles.badgesSection}>
              {profileData.badges.map((badge, index) => (
                <a key={index} href={badge.url}>
                  <img src={badge.image} alt={badge.alt} className="badgeimage" />
                </a>
              ))}
            </div>
          </div>
          <div className={clsx('col', 'profileimg-container', styles.heroImageCol)}>
            <div className={styles.profileImgWrapper}>
              <img src={profileData.profileImage.src} alt={profileData.profileImage.alt} className="profileimg" />
            </div>
            <button onClick={() => downloadResume(locale)} className={styles.resumeButton}>
              <svg viewBox="0 0 24 24" className={styles.resumeIcon} aria-hidden="true">
                <path d="M12 16l-5-5 1.41-1.41L11 13.17V4h2v9.17l2.59-2.58L17 11l-5 5zm-7 4v-2h14v2H5z"/>
              </svg>
              {ui.downloadResume}
            </button>
            <div>
              <a href={profileData.learnMoreLink.url} className={styles.terminalLink}>
                <div className={styles.terminalArrowHint} aria-hidden="true">
                  <span className={styles.terminalHintLabel}>EXPLORE</span>
                  <span className={styles.cmdArrow}>▶</span>
                </div>
                <div className={styles.terminalCard}>
                  <div className={styles.terminalBar}>
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.terminalTitle}>dgsite.infra</span>
                    <span className={styles.liveTag}>
                      <span className={styles.livePulse} />
                      LIVE
                    </span>
                  </div>
                  <div className={styles.terminalBody}>
                    <div className={styles.cmdLine}>
                      <span className={styles.cmdPrompt}>$</span>
                      <span className={styles.cmd}>{ui.terminalCmd}</span>
                    </div>
                    <div className={styles.pipeline}>
                      <span className={styles.stage}>BUILD ✓</span>
                      <span className={styles.pipeArrow}>──▶</span>
                      <span className={styles.stage}>TEST ✓</span>
                      <span className={styles.pipeArrow}>──▶</span>
                      <span className={styles.stage}>DEPLOY ✓</span>
                    </div>
                    <div className={styles.techRow}>
                      {['K8s', 'AWS', 'Terraform', 'ArgoCD', 'Docker'].map(t => (
                        <span key={t} className={styles.techPill}>{t}</span>
                      ))}
                    </div>
                    <div className={styles.cta}>
                      {ui.exploreArch}
                      <span className={styles.ctaArrow}>→</span>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

const WorkIcon = () => (
  <svg className="MuiSvgIcon-root" focusable="false" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
  </svg>
);

const EducationIcon = () => (
  <svg className="MuiSvgIcon-root" focusable="false" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
  </svg>
);

function DescStack({ label, items }) {
  return (
    <div className={styles.descStack}>
      <span className={styles.descStackLabel}>{label}</span>
      <div className={styles.descStackPills}>
        {items.map((item, i) => (
          <span key={i} className={styles.descStackPill}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function renderDescBlock(line, i) {
  // "- Label: item1, item2, ..." → labeled tech-stack pills
  const stackMatch = line.match(/^-\s+([^:]+):\s*(.+)$/);
  if (stackMatch) {
    const label = stackMatch[1].trim();
    const items = stackMatch[2].replace(/\.$/, '').split(',').map(s => s.trim()).filter(Boolean);
    return <DescStack key={i} label={label} items={items} />;
  }
  // default → prose paragraph
  return <p key={i} className={styles.descProse}>{line}</p>;
}

function Experience({ locale }) {
  const ui = UI[locale] || UI.en;
  return (
    <div id="experience" className={styles.experienceSection}>
      <div className={styles.sectionHeader}>
        <h2>{ui.experience}</h2>
      </div>
      <VerticalTimeline lineColor='var(--ifm-color-primary)'>
        {profileData.experiences.map((exp, index) => {
          const title = loc(locale, exp, 'title');
          const date = loc(locale, exp, 'date');
          const description = loc(locale, exp, 'description');
          return (
            <VerticalTimelineElement
              key={index}
              className="vertical-timeline-element--work"
              contentStyle={{ background: 'var(--ifm-color-primary-lightest)', color: 'var(--ifm-color-primary-dark)' }}
              contentArrowStyle={{ borderRight: '30px solid var(--ifm-color-primary-lightest)' }}
              date={date}
              dateClassName="contrastWithBackground"
              iconStyle={{
                background: exp.type === 'work' ? 'var(--ifm-color-primary)' : 'var(--ifm-color-primary-lighter)',
                color: '#fff'
              }}
              icon={exp.type === 'work' ? <WorkIcon /> : <EducationIcon />}
            >
              <h3 className="vertical-timeline-element-title">{title}</h3>
              <h4 className="vertical-timeline-element-subtitle">{exp.subtitle}</h4>
              {description && (
                <div className={styles.descBlock}>
                  {description.map((line, i) => renderDescBlock(line, i))}
                </div>
              )}
            </VerticalTimelineElement>
          );
        })}
        <VerticalTimelineElement
          iconStyle={{ background: 'rgb(53 146 86)', color: '#fff' }}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="512" height="512">
              <path d="M20.492,7.969,10.954.975A5,5,0,0,0,3,5.005V19a4.994,4.994,0,0,0,7.954,4.03l9.538-6.994a5,5,0,0,0,0-8.062Z" />
            </svg>
          }
        />
      </VerticalTimeline>
    </div>
  );
}

export default function Home() {
  const { siteConfig, i18n } = useDocusaurusContext();
  const locale = i18n.currentLocale;
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Ricard Llop">
      <HomepageHeader locale={locale} />
      <div className={styles.sectionDivider} />
      <main>
        <Experience locale={locale} />
      </main>
    </Layout>
  );
}
