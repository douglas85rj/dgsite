import {themes as prismThemes} from 'prism-react-renderer';
const dockerImageTag = process.env.DOCKER_IMAGE_TAG || 'latest';
const urlvar = process.env.DOCUSAURUS_CONF_URL || 'http://localhost:80';
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Douglas',
  tagline: 'Devops Engineer',
  favicon: 'img/favicon.ico',

  // TO DO Set the production url of your site here
  url: urlvar,
  baseUrl: '/',
  organizationName: 'ricardllop',
  projectName: 'dgsite',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    localeConfigs: {
      en: { label: 'English' },
      es: { label: 'Español' },
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl:
            'https://github.com/ricardllop/dgsite',
        },
        blog: {
          showReadingTime: true,
          editUrl:
            'https://github.com/ricardllop/dgsite',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/devops.png',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Me',
        logo: {
          alt: 'My Site Logo',
          src: 'img/sitelogo.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Infrastructure behind this site',
          },
          {to: '/blog', label: 'Portfolio', position: 'left'},
          {
            href: 'https://github.com/ricardllop',
            label: 'GitHub',
            position: 'right',
          },
          {
            type: 'localeDropdown',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'How is this hosted',
                to: '/docs/site-infrastructure',
              },
              {
                label: 'Portfolio',
                to: '/blog',
              },
            ],
          },
          {
            title: 'Contact',
            items: [
              {
                label: 'Linkedin',
                href: 'https://www.linkedin.com/in/ricard-llop-palou-devops/',
              },
              {
                label: 'Mail',
                href: 'mailto:ricardlloppalou@gmail.com',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Site Docker Image',
                href: 'https://hub.docker.com/r/rllopdev/dgsite/tags',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/ricardllop',
              },
            ],
          },
        ],
        copyright: `Docker Image Tag: ${dockerImageTag} - Copyright © ${new Date().getFullYear()} RLlopSite, Inc. Built with React.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;